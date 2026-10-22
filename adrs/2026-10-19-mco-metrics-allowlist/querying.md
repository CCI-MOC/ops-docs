# Querying fleet metrics without double counting

Supporting detail for [the ADR](README.md). A metric name can reach the hub by more than one path,
and more than one scrape of the same target can sit inside a single path, so one subject can produce
several series under the same `cluster` label. All queries below were run against
`rbac-query-proxy` on the dev hub, 2026-10-22.

## The duplication

`etcd_server_has_leader` for `oac-dev-workload0`:

| namespace | container | `managementcluster` | `job` | series |
|---|---|---|---|---|
| `clusters-oac-dev-workload0` | `etcd-metrics` | `local-cluster` | `etcd` | 3 |
| `clusters-oac-dev-workload0` | `etcd-metrics` | `local-cluster` | `etcd-client` | 3 |
| `clusters-oac-dev-workload0` | `haproxy` | absent | `acm-etcd` | 3 |
| `openshift-etcd` | `haproxy` | absent | `etcd` | 3 |

Twelve series for three etcd members, and **the transport paths explain only part of it**. Two
ServiceMonitors scrape the same pods on the hub, one as `job=etcd` and one as `job=etcd-client`, so
the hub-scraped group alone holds six series for three members. Why both exist was not investigated;
it is a second multiplication sitting inside the first.

So `count by (cluster)` reports 12 series for workload0's three members and 6 for each of the other
clusters' three. Those series counts are correct; what is wrong is reading them as a number of
members, which overstates by four on workload0 and by two elsewhere.

The two `haproxy` rows are the HCP forwarder. The second carries `namespace="openshift-etcd"`, which
on a hosted cluster holds no etcd: checked on the cluster, the namespace exists and is empty, no
pods. Forwarding relabels to the control plane's native identity, so the namespace names where such
a metric would live on a standalone cluster, not where it was produced.

`cluster` says which cluster the data is **about**. The differences shown in `namespace`, `container`,
`managementcluster` and `job` reflect the scrape and forwarding contexts, not different subjects —
while `pod` below is the identity of the observed member.

## How many names are affected

Per cluster, counted as **names appearing in multiple `managementcluster` groups**, which is a
candidate list rather than proven duplication:

| cluster | names in multiple `managementcluster` groups |
|---|---|
| `local-cluster` | 0 |
| `oac-dev-workload0` | 23 |
| `oac-dev-workload1` | 3 |
| `oac-dev-workload2` | 3 |

workload1 and workload2 show only the generic three: `up`, `grpc_server_started_total` and one
recording rule. For generic names like these the groups may well describe entirely different targets,
so a hit is a reason to look, not a duplicate. workload0 shows twenty more, almost all etcd, and it
is the cluster with forwarding enabled.

Enabling forwarding elsewhere should be expected to add overlaps, though not necessarily these same
23 names. The set therefore grows with a switch we control, not only with new exporters.

## Counting members instead of series

```promql
count by (cluster) (group by (cluster, pod) (etcd_server_has_leader))
# -> local-cluster 3, workload0 3, workload1 3, workload2 3
```

This answers **how many distinct etcd pods appear in the available samples**, which is usually what
somebody counting etcd wanted. `group by` says that intent plainly; `max by (cluster, pod)` returns the same
numbers here and is the older form of the same query.

Two things it does **not** do. It is not a health check: the outer `count` counts groups regardless
of their value, so it returns 3 even if all three pods report `etcd_server_has_leader=0`. And it is
not a general recipe for deduplicating metric values — it works because `(cluster, pod)` identifies a
member for this metric, which we checked, and because every path reports the same `etcd-0/1/2`.

**Do not group by `namespace`, `container` or `job`**: those are exactly the labels that differ per
scrape context, so adding them restores the duplication.

## Showing scrape and forwarding contexts

```promql
count by (cluster, namespace, container) (etcd_server_has_leader)
```

Suitable for a table or an overview panel, where seeing the separate rows is the point. This grouping
collapses `job=etcd` and `job=etcd-client` into one row; add `job` to see the four rows from the
table at the top.

## Do not use managementcluster as the separator

It distinguishes hub-scraped series from the rest, but forwarded and collector-sent series both have
it absent, so it does not separate all three paths. Filtering on it also drops clusters silently,
measured **for `etcd_server_has_leader`** — which clusters a filter returns depends on the metric:

| filter | clusters returned |
|---|---|
| `managementcluster=""` | `local-cluster`, `workload0` |
| `managementcluster="local-cluster"` | `workload0`, `workload1`, `workload2` |

Neither returns all four. The hub does have its own control plane, but its etcd metrics do not carry
`managementcluster="local-cluster"` in this measurement — that label marks hosted control planes
scraped on the hub, not the hub's own components.

`container="haproxy"` identifies the forwarder for control plane metric names, but `haproxy` also
names ordinary router containers — 786 series on workload0 — so use it together with a metric name,
never alone.

## Searching for possible overlaps

Per cluster; an unbounded `{__name__=~".+"}` across the fleet times out here.

```promql
count by (__name__) (
  count by (__name__, managementcluster) ({__name__=~".+", cluster="$cluster"})
) > 1
```

Grouping on `managementcluster` is deliberate. Adding `namespace` or `container` turns the query into
a list of ordinary multi-pod metrics: that variant returned 35 names for the hub, where this method
finds none. As written it returned 0 for the hub and 23, 3, 3 for the workloads.

It is a search, not a proof, in both directions. **A hit does not establish a duplicate** — the
groups may describe different targets, which is likely for generic names such as `up`. **No hit does
not rule one out** either, because duplication sitting entirely on one side of the
`managementcluster` split is invisible to it; for that, compare `count by (namespace, container, job)`
for the metric in question.

Worth running after enabling forwarding on a cluster, or after adding an exporter that uses generic
names such as `up`, `go_*` or `process_*`.
