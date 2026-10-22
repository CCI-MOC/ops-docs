---
title: Keep the MCO allowlist for now, keep exclusion open as an option
---

## Context

ACM MultiClusterObservability collects by allowlist. The hub's
`observability-metrics-allowlist` names 214 metrics plus 13 label matchers, and the
`metrics-collector` turns that into **227 `--match` arguments** against the local Prometheus
`/federate` endpoint. A second collector does the same for user workload metrics with 35 matchers.

Every argument pins `__name__` to one exact value:

```
--match={__name__=":node_memory_MemAvailable_bytes:sum"}
--match={__name__="ALERTS"}
--match={__name__="acm_managed_cluster_labels"}
```

A metric that is not named does not get filtered out. It is never asked for. The collector has no
`--drop`, no `--exclude` and no `--relabel`, so this list is the whole mechanism.

Despite it's name, the allowlist is not purely additive. ACM documents
[how to remove a metric][rm] by prefixing its name with a hyphen in `metrics_list.yaml`, for example `-cluster_infrastructure_provider`. This permits excluding specific metrics by name, but does not permit excluding metrics with a pattern, which is the thing this ADR is about.

We run it this way becuase the goal was to stay **as close to MOC 1.0 as possible**, and MOC 1.0 runs
the allowlist that ACM ships. Worth writing down that this was the reason, and not a comparison with
the alternative.

### Why look at it again

Two things made the question visible.

**COO showed us the other shape.** The Cluster Observability Operator works with collection rules,
and those can exclude as easy as include. Which raises the question whether "everything except" is
something we cannot have, or something we never tried.

**On the HCP side we already collect by exclusion.** We run `METRICS_SET=SRE` with the
`sre-metric-set` ConfigMap, and that is a drop configuration. A new metric from a control plane
component is collected unless a rule removes it. So inside one environment we run both models, and
only the central hop is allow-only.

This asymmetry costs us something real. A new metric shows up on a cluster, gets scraped locally,
sits in the local Prometheus, and quietly does not reach the hub. Nobody gets told. It arrives
centrally when somebody remembers to add the name, and normaly somebody remembers only after they
needed it and it was not there.

### How big the gap is

A hosted cluster runs its own full monitoring stack, `prometheus-k8s` and `thanos-querier` plus user workload monitoring. That comes
with OpenShift and has nothing to do with MCO or COO. So everything gets measured locally, whether
we collect it or not.

Measured on `oac-dev-workload0`, 2026-10-19:

| | metric names |
|---|---|
| visible locally in the hosted cluster | **3412** |
| arriving at the hub for that cluster | **27** |

The 27 are the control plane: apiserver, etcd, grpc, workqueue. One thing we did not establish is
how much of that gap the allowlist actually causes. The 27 arrive labelled with the hosted cluster
but are scraped on the hub by UWM, so the two numbers may not even describe the same path, and
central recording rules could carry some of the rest under different names. The gap is measured,
its cause is not. These are not exotic metrics:

| metric | series locally | at the hub |
|---|---|---|
| `container_cpu_usage_seconds_total` | 1322 | not collected |
| `kube_deployment_status_replicas` | 106 | not collected |
| `kube_node_info` | 5 | not collected |
| `node_memory_MemFree_bytes` | 5 | not collected |

`container_cpu_usage_seconds_total` is the base for every utilisation question. It gets measured on
every cluster and you cannot ask for it from the hub.

So the allowlist does not cost us a handful of edge cases. We collect about one percent of what the
fleet measures anyway, and which one percent that is was decided by whatever metrics MOC 1.0
happened to need.

### What we measured

Dev hub, 2026-10-19. OpenShift 4.22.14, ACM 2.17.3, COO 1.5.3. Read-only apart from one short test
described below.

The installed collector is the classic one, `metrics-collector-deployment` plus
`endpoint-observability-operator`. There is no `PrometheusAgent` and no `ScrapeConfig`, so the newer
add-on is not in use. MCO federates from `prometheus-k8s.openshift-monitoring.svc:9091` and writes
to Observatorium every 300 seconds.

There is also no `MonitoringStack`, and the reason is worth stating correctly, because it is neither
a limitation of COO nor a cost we decided against. A COO `MonitoringStack` per cluster, with
`remoteWrite` to a stack on the hub, was the **fallback** we had planned for the case that no object
storage became available for MCO. S3 did become available, MCO runs, and the fallback was never
needed. Our COO chart therefore deploys the operator and the UI plugin and nothing else.

Building one now would not block MCO, the two do not interfere, but it would also not help. MCO
federates from platform monitoring and UWM, and would not read a third Prometheus unless we
repointed the collector or set up `remoteWrite`. It would add scrape load and storage on the
cluster for data that is already collected locally. How much depends on which targets it takes and
at what interval, which we did not work out, because a second stack is not needed for a change to
the MCO selection in the first place.

**Prometheus handles exclusion without any trouble.** Through `/federate` on the hub's own
Prometheus:

| matcher | distinct metric names |
|---|---|
| `{__name__=~".+"}` | 4038 |
| `{__name__=~".+",__name__!="go_goroutines"}` | 4037 |
| `{namespace="openshift-monitoring"}` | 1303 |

**MCO passes a non-pinned matcher through unchanged.** We created
`observability-metrics-custom-allowlist` with one entry, `__name__=~"oactest_.*"`, picked because it
matches nothing today and therefore moves no data:

| | |
|---|---|
| `--match` arguments before | 227 |
| after the ConfigMap was created | **228** |
| time until the collector was redeployed | 15 seconds |

It was not rejected and not rewriten into a pinned form. The ConfigMap was deleted 54 seconds after
it was created, the count went back to 227, and `thanos-receive` ran through without a restart.

### What that does and does not tell us

Shown: the ConfigMap is accepted, the regex selector lands in the collector arguments, removing it
restores the old state. Not shown: that additional series actually travel, and that an exclusion
works next to the selectors already there.

The second one we measured afterwards. Prometheus joins several `match[]` selectors with OR, not
AND, and our test added argument 228 next to 227 that stayed:

| selectors passed to `/federate` | `go_goroutines` lines returned |
|---|---|
| the negative one alone | **0** |
| the negative one plus another that matches it | **138** |

So a negative matcher added to the existing list excludes nothing. It would only work if the 227
pinned selectors went away at the same time, which is a bigger change than adding one entry.

What stands: the allowlist is a default and not a hard limit, and a broad selector is accepted.
Whether that is a documented interface or current behaviour, we did not find out, and an upgrade is
where an accident stops working.

## Decision

**We keep the allowlist**, as the model. It is what MOC 1.0 runs, there it is proven in production,
and our own reason for picking it still holds.

We are not freezing its contents. Adding names stays normal work and does not reopen this
decision, CCI-MOC/oac-apps#140 is exactly that, and removing a default metric with `-name` is
equally normal and documented. Both directions are open by name. What we cannot have is the
pattern, so the question is narrower than "allowlist or blocklist": whether metrics we never named
should arrive by themselves.

An alternative that exists does not make the current choice better. What changed is only what we
know, and the documentation gives us no cover for it.

In the ACM 2.17 observability guide the custom allowlist is documented with `names` and
`recording_rules`, and nothing else. The `matches` field does appear, but only inside
`collect_rules`, in the section on [dynamic metrics for single-node OpenShift][sno], where extra
metrics get collected while a cluster is under load. Collection stops when the condition no longer
applies, at the earliest 15 minutes after it started. All four documented examples there pin
`__name__` to one exact value, like
`__name__="container_memory_rss",container!=""`. Broad or negative `__name__` matchers are not
described anywhere, and there is no warning about them either, the guide simply does not mention
the case.

So `__name__=~"oactest_.*"` is measured implementation behaviour, not a documented interface.

Second finding from the docs: ACM 2.17 documents a migration path away from the allowlist resource,
with a command-line tool shipped as a product tool, §1.11.12 "Migrating custom allowlist":

> Use the allowlist-migration command-line interface to convert the
> observability-metrics-allowlist custom resource to ScrapeConfig and PrometheusRule resources.

The reason the guide gives is scalability: "Converting to the ScrapeConfig and PrometheusRule
resources allows for a scalable way to manage your custom allowlist configuration."

What the documentation does **not** say is that the allowlist is deprecated, legacy or superseded.
We looked, it is not there. So a migration path exists, with scalability as the stated reason, and
nothing announces the end of the current mechanism. Putting an undocumented extension on a resource
that already has a documented migration path is still a bet on two things at once.

So we stay where we are. Not because the allowlist is better, but because we would swap something
that works for something we have not checked far enough.

**We write the option down instead of closing it.** A custom allowlist entry like this one is
accepted:

```yaml
data:
  metrics_list.yaml: |
    matches:
      - __name__=~".+",__name__!="<excluded metric>"
```

But on its own it does not give "everything except". Because the selectors are OR-ed, this adds a
broad selection next to the 227 that stay, and the exclusion has no effect on what they already
pull. A real block list needs the existing selectors gone, and how to do that without touching the
operator-owned `observability-metrics-allowlist` is the open question.

The ConfigMap itself is a documented extension point. That the matcher syntax we put in it is
supported does not follow from that, and we have no evidence for it.

### What would make us revisit

Conditions, not a date:

1. Red Hat documents the matcher semantics, so a broad matcher becomes a supported interface and
   not just an observation. Checked on 2026-10-19 against the ACM 2.17 observability guide: it does
   not, the allowlist is documented with `names` and `recording_rules` only.
2. The gap starts to cost us, meaning we keep adding metrics afterwards because somebody needed one
   and it was not there. Worth counting that, right now it is a feeling and not a number.
3. We move away from the classic collector. The newer add-on with `PrometheusAgent` and
   `ScrapeConfig` has a different filter model, so then the question comes up fresh anyway. ACM
   2.17 already ships `allowlist-migration` for that step, with the `multicluster-observability-addon`
   on the hub as a prerequisite. Whenever we take it, the filtering model is open again and should
   be decided then, not inherited.
4. We want a collection path that MCO does not give us. COO is installed and could run a
   `MonitoringStack`, the fallback we planned before S3 existed. That is a different answer to a
   different problem, so it only comes up if the requirement changes, not the filtering.

## Consequences

**By keeping the allowlist** we keep what we know: a bounded set, predictable volume, and the same
configuration MOC 1.0 runs since a long time. We keep the gap as well. A metric that exists on a
cluster you cannot query centrally until somebody names it, and nothing tells us when that happens.

**The coverage gap is measured, its cost is not.** Of the metric names on that one cluster we
collect about one percent centrally, the rest is only reachable on the cluster itself. What that
costs in practice we have not quantified: how often somebody needs a metric that is not there, and
what the detour costs them. Every new exporter or operator means deciding whether we want its
metrics centrally, and that is easy to forget. We do not keep the allowlist because the gap is
small, we keep it because the alternative stands on behaviour we have seen once.

**For the next person**, the measurements above are the starting point. What still needs answering:
whether the volume carries, what belongs on a block list, and how we would notice a
high-cardinality exporter that appears somewhere in the fleet.

**One thing we would lose** if we ever switch. Today the allowlist is a kind of silent contract
about what the hub holds. Querying stays predictable because
the set is counted out. With exclusion the set is whatever the fleet exports, which is bigger and
moves by itself.

## See also

- `METRICS_SET=SRE` and the `sre-metric-set` ConfigMap, the drop-based model we already run for
  hosted control planes
- ACM 2.17 observability guide, [dynamic metrics for single-node OpenShift][sno], the only
  documented use of `matches`, and [§1.11.12 Migrating custom allowlist][mig] for the migration
  path to `ScrapeConfig` and `PrometheusRule`

[rm]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#removing-default-metrics
[sno]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#dynamic-metrics-sno
[mig]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#migrate-allowlist-mcoa
- CCI-MOC/oac-apps#140, which adds a custom allowlist as a named list, the shape this ADR keeps
- CCI-MOC/oac-apps#114, where the SRE drop rules turned out to cut about 40 percent rather than the
  94 percent that had been projected
- The ADR on per-project metric separation, which covers the other half of "why can somebody not see
  this metric". This one is about what we collect at all; that one is about who may read what has
  been collected. Both answers are needed to work out where to look when a metric is missing.
