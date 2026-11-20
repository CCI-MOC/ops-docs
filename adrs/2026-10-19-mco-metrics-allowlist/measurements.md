# Measurements behind the MCO allowlist ADR

Supporting detail for [the ADR](README.md). Numbers are one cluster on one day; the local figure went
from 3412 on 2026-10-19 to 4068 on 2026-10-22 on the same cluster, so re-measure before quoting.

**On reproducing these counts.** Every **metric-name count** below came from
`GET /api/v1/label/__name__/values` with the `match[]` shown, through the route named in each
section, and **without explicit `start` and `end`** — so each is the names the endpoint reported at
that moment, under whatever default window it applies, rather than names active in a stated interval.
Series counts come from `GET /api/v1/query` with `count(...)`, and the `/federate` figures further
down from that endpoint directly; both are noted where they appear. Good enough for the orders of magnitude this
ADR argues with; not good enough to compare a local against a central figure precisely, because the
two sides retain for different periods. A repeat should pin an identical explicit window on both
sides and say whether it counts names seen in that window or series present now.

How volatile that makes the figures is visible in the data itself: the local count went from 3412 to
4068 in three days, and the central count for one cluster read 171 in the morning and 257 in the
afternoon of 2026-10-22, the difference being test data still inside retention.

## Environment

Dev hub, 2026-10-19 and 2026-10-22. OpenShift 4.22.14, ACM 2.17.3, COO 1.5.3. Read-only apart from
the one allowlist test below.

The installed collector is the classic one, `metrics-collector-deployment` plus
`endpoint-observability-operator`. No `PrometheusAgent` and no `ScrapeConfig`, so the newer add-on is
not in use. MCO federates from `prometheus-k8s.openshift-monitoring.svc:9091` and writes to
Observatorium every 300s.

## How much the allowlist selects

| | names | queried against |
|---|---|---|
| local on `oac-dev-workload0` | 4068 | the cluster's own `thanos-querier` route |
| arriving at the hub for it | 171 | the hub's `rbac-query-proxy` route |

```
# local, run against the hosted cluster
GET /api/v1/label/__name__/values

# central, run against the hub
GET /api/v1/label/__name__/values?match[]={cluster="oac-dev-workload0"}
```

Use the right endpoint on the hub: in our configuration the `thanos-querier` route there serves the
hub's own monitoring data, so it answers for `local-cluster` and not for the fleet. MCO data is
behind `rbac-query-proxy`.

## The three paths to the hub

Three ways exist. The counts below come from **label selections used to investigate the paths**,
not from selectors proven to identify a path, measured 2026-10-22 against the hub:

| path | how it reaches the hub | selection used | names |
|---|---|---|---|
| HCP control plane | scraped by hub UWM in `clusters-<name>` | `managementcluster="local-cluster"` | 28 |
| the cluster itself | scraped locally, federated by its own `metrics-collector` | no `managementcluster`, `container!="haproxy"` | 141 |
| HCP forwarder | fetched by `metrics-proxy` on the hub, relabelled to look native | `container="haproxy"` | 37 |

Measured intersections, and they reconcile with the total:

| | names |
|---|---|
| control plane ∩ forwarder | 22 |
| forwarder ∩ local | 12 |
| control plane ∩ local | 3 |
| **all three** | **2** (`up`, `grpc_server_started_total`) |
| union, 28 + 141 + 37 − 22 − 12 − 3 + 2 | **171** |

Both names occur in all three label selections; that alone does not establish which transport paths
their series took. They are generic names, which is the likely reason they match everywhere. The
large control plane/forwarder overlap is expected in the same loose sense: both are understood to
carry the same control plane metrics, which is the duplication [querying.md](querying.md) is about.

```
# all against the hub, C = cluster="oac-dev-workload0",__name__!~"ovs_.*"
?match[]={C,managementcluster="local-cluster"}                     ->  28
?match[]={C,managementcluster="",container!="haproxy"}             -> 141
?match[]={C,container="haproxy"}                                   ->  37
?match[]={C}                                                       -> 171
?match[]={C,managementcluster=""}                                  -> 166   # local + forwarder
?match[]={cluster="oac-dev-workload0",managementcluster=""}        -> 252   # same, with the test names
```

**Why these are selections and not paths.** `container="haproxy"` is not a path marker: for this
cluster it appears in 11 namespaces, among them `openshift-monitoring` and `openshift-kube-scheduler`
as well as `clusters-oac-dev-workload0`, because ordinary routers use that container name too. It
coincides with the forwarder for control plane metric names, but **the 37 counted here are all names
matching `container="haproxy"`**, not a filtered subset: no extra control plane condition was applied
to that query. The `etcd_server_has_leader` example below illustrates the forwarder, it does not
identify the whole selection. A selector that identifies the forwarder on its own was not
established. `managementcluster=""` is likewise not the local path by itself — forwarded series carry
no such label, which is why that filter returns 166 rather than 141.

So the three selections cover the 171 exactly and the intersections are consistent, but the mapping
from selection to transport path rests on the label sets below rather than on a proven filter.

A note on the live totals: queried today the same cluster reports **257** names rather than 171,
because the 86 `ovs_*` names from the pattern test are still in the TSDB and age out with retention.
Every count above excludes them with `__name__!~"ovs_.*"` except where shown, and 257 − 86 = 171
reproduces the figure from earlier in the day.

The forwarder path exists only where `spec.monitoring.metricsForwarding` is on, today
`oac-dev-workload0` alone.

One metric on two paths, both labelled `cluster="oac-dev-workload0"`, with the labels that tell them
apart:

```
etcd_server_has_leader  job=etcd  namespace=clusters-oac-dev-workload0  container=etcd-metrics  managementcluster=local-cluster
etcd_server_has_leader  job=etcd  namespace=openshift-etcd              container=haproxy       (no managementcluster)
```

A metric that only takes the local path looks different again: `node_cpu_seconds_total` arrives with
`job=node-exporter`, `namespace=openshift-monitoring` and a node name in `instance`.

## Patterns in the custom allowlist

`matches: [__name__=~"ovs_.*"]` added next to the three DCGM names, dev hub, 2026-10-22, reverted
afterwards. Before the change the central query returned no `ovs_*` names at all, so the before value
is a clean zero. Locally the metrics existed throughout, which is what made them a usable test
subject. Both figures against that cluster's own `thanos-querier` route:

```
GET /api/v1/label/__name__/values?match[]={__name__=~"ovs_.*"}   ->  86 names
GET /api/v1/query?query=count({__name__=~"ovs_.*"})              -> 445 series
```

| | before | with the pattern |
|---|---|---|
| `ovs_*` names at the hub, **fleet wide** | 0 | 86 |
| clusters contributing | — | 3 of 3 |
| `--match` arguments on the collector | 230 | 230 |

```
# before and after, run against the hub
?match[]={__name__=~"ovs_.*"}                                -> 0, then 86 names
?match[]={__name__=~"ovs_.*"}  on label cluster              -> workload0, workload1, workload2
```

The 86 is the **union across the three clusters**, not 86 per cluster; the per-cluster split was not
recorded. The series arrived on the federated path, `job=ovnkube-node`, no `managementcluster` label.
86 is whatever `ovs_*` exports today; what the test shows is that one pattern reached all three
clusters under test.

**The matcher count did not change, and the data arrived anyway.** The pattern appeared neither in
the merged `observability-metrics-allowlist` on the managed cluster nor in the collector arguments,
yet the metrics arrived. So the visible `--match` list is **not the whole effective selection**;
there is at least one further configuration path.

What we observed of that path, and no more: five seconds after the write the operator logged
`triggered_by="observability-metrics-custom-allowlist"` together with
`"Find updated data in secret" secret="observability-metrics-allowlist"`. We did **not** inspect that
secret, so its contents and who consumes them are unverified. Treat the secret as a pointer to the
additional path, not as a documented mechanism. `names:` by contrast is visible: the three DCGM names
sit in the merged ConfigMap and in the collector arguments.

Practical consequence for anyone testing this: watching the ConfigMap or the collector arguments
makes a working pattern look ignored. Watch the arriving metrics, or the operator log.

`names:` is proven separately and in production: the three DCGM metrics have been at the hub since
2026-10-20 through this mechanism, and appear in the collector arguments as
`--match={__name__="DCGM_..."}`.

## Exclusion

Prometheus joins several `match[]` selectors with OR, so a selector **added** next to the 230 that
stay can only union with them. Three statements worth keeping apart:

1. A **single** selector can restrict its own selection with a negative condition. Measured below,
   4038 against 4037.
2. An **added** selector removes nothing that the other selectors already match. This follows from
   the OR semantics.
3. **Rebuilding the whole MCO selection** was never tested, and it is a different change from
   editing a list.

An earlier `/federate` observation from 2026-10-19 is not used as evidence: the requests were not
recorded and the route answers 503 for our tokens since 2026-10-22, so it cannot be repeated. Point 2
rests on the OR semantics.

For reference, a selector restricting itself is not the hard part. Measured 2026-10-19 through
`/federate` on the hub's own Prometheus, counting distinct `__name__` values in the response:

| matcher | distinct names |
|---|---|
| `{__name__=~".+"}` | 4038 |
| `{__name__=~".+",__name__!="go_goroutines"}` | 4037 |
| `{namespace="openshift-monitoring"}` | 1303 |

The single removed name is the whole point of the middle row. This route no longer answers for us,
see above.

## Why there is no COO MonitoringStack

Neither a COO limitation nor a cost we decided against. A `MonitoringStack` per cluster with
`remoteWrite` to a hub stack was the **fallback** planned in case no object storage became available
for MCO. S3 did become available, MCO runs, the fallback was never needed. Our COO chart deploys the
operator and the UI plugin, nothing else.

Building one now would not block MCO, and it would not answer the question this ADR is about: MCO
federates from platform monitoring and UWM and would not read a third Prometheus without repointing
the collector or setting up `remoteWrite`, so the central selection would stay exactly as it is. It
would also add scrape load and storage for data already collected locally.

## Documentation status

ACM 2.17 documents the custom allowlist with `names` and `recording_rules`. `matches` appears in the
guide only inside `collect_rules`, for dynamic metrics on single-node OpenShift, and all four
examples there pin `__name__` to one value.

The hub's own default allowlist nevertheless carries a top-level `matches:` with 13 entries,
including `job=~"apiserver|etcd"` and `container!=""`, and those reach the collector arguments on
every managed cluster. So the key is real and in production use; what is undocumented is the
specific use as a **general name pattern in the custom allowlist**, not `matches` as such. That is
measured implementation behaviour on 2.17.3. How Red Hat would classify a regression there is a
support question nobody has asked.
