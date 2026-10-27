---
title: Collect central metrics using MultiClusterObservability allowlist keeping exclusion lists as a future change
---

## Context

ACM MultiClusterObservability (MCO) collects metrics with an allowlist. The hub's
`observability-metrics-allowlist` names 214 metrics plus 13 label matchers, and the
`metrics-collector` turns that into **227 `--match` arguments** against the local Prometheus
`/federate` endpoint. A second collector does the same for user workload metrics with 35 matchers
(counted on 2026-10-19. It is 230 since CCI-MOC/oac-apps#140 merged on 2026-10-20 and added three
DCGM names through the custom allowlist, which is what a routine addition looks like).

Nearly every argument pins `__name__` to one exact value:

```
--match={__name__=":node_memory_MemAvailable_bytes:sum"}
--match={__name__="ALERTS"}
--match={__name__="acm_managed_cluster_labels"}
```

A metric no selector matches does not get filtered out. It is never asked for. The collector has no
`--drop`, no `--exclude` and no `--relabel`, so selection happens by asking rather than by filtering
what was scraped.

The visible `--match` arguments do not describe the complete effective selection, though. A pattern
we put in the custom allowlist caused additional metrics to arrive without changing those arguments
at all. The additional configuration path was not fully traced, see
[measurements.md](measurements.md). So reading the arguments is not a reliable way to see the whole
selection.

Despite its name, the allowlist is not purely additive. ACM documents [how to remove a metric][rm]
by prefixing its name with a hyphen in `metrics_list.yaml`, for example
`-cluster_infrastructure_provider`. This permits excluding specific metrics by name, but does not
permit excluding metrics with a pattern, which is the thing this ADR is about.

We run it this way becuase the goal was to stay **as close to MOC 1.0 as possible**, and MOC 1.0 runs
the allowlist that ACM ships.

### The question

Should locally collected metrics reach the hub by default, unless explicitly excluded?

Today they do not. Two things made that worth asking.

**Not in question: the contents of the list.** Adding names is routine, removing one with `-name` is
documented, and a pattern adds all metrics matching a prefix in one line. Any set of metrics MCO
could collect is reachable by editing the list, so "we collect too few" is not a decision, it is a
pull request. What cannot be edited is the shape:

|           | MCO    | COO |
|-----------|--------|-----|
| allowlist | yes    | yes |
| drop list | **no** | yes |
- MCO: Multi Cluster Observability
- COO: Cluster Observability Operator

That is upstream behaviour, not configuration, and it is the one constraint this ADR works around.

**COO showed us the other shape.** The Cluster Observability Operator works with collection rules,
and those can exclude as easily as include. Which made it worth finding out whether "everything except"
is something MCO cannot do, or something we never tried.

**On the HCP side we already collect by exclusion.** We run `METRICS_SET=SRE` with the
`sre-metric-set` ConfigMap, and that is a drop configuration. A new metric from a control plane
component is collected unless a rule removes it. So inside one environment we run both models, and
only the central hop is allow-only.

That asymmetry is defensible, and worth stating rather than fixing. The two halves have different
owners: the control plane is ours to run but the vendor's to shape, and the drop list is the shape
it ships with. What each cluster sends upward is our selection. Different owner, different model.

What the allow-only hop does cost is attention. A new metric shows up on a cluster, gets scraped
locally, sits in the local Prometheus, and quietly does not reach the hub. Nobody gets told. It
arrives centrally when somebody remembers to name it, and normaly somebody remembers only after they
needed it and it was not there.

### How big the gap is

A hosted cluster runs its own full monitoring stack, platform `prometheus-k8s` plus user workload
monitoring. That comes with OpenShift and is unrelated to MCO, so what those stacks scrape is
measured locally whether we collect it centrally or not.

| | names |
|---|---|
| local on `oac-dev-workload0` | 4068 |
| arriving at the hub for it | 171 |

One cluster on one day: the local figure was 3412 three days earlier. The two queries also ran
**without a common explicit time window**, and the count alone does not establish that the central
set is a subset of the local one. So the two numbers show that the endpoints report very different
amounts of metric names, not an exact current coverage. Details and the three paths a metric can take
to the hub in [measurements.md](measurements.md).

Which names are missing is not the interesting part, since each is one list entry away. What matters
is where the 171 come from: a base taken over from MOC 1.0 for compatibility, extended since by
individual additions such as the three DCGM names, which are part of that count. So the selection has
been added to but never reviewed against MOC 2.0's own requirements. That was the occasion for
checking whether explicit selection is still the right model, which is what this ADR records.

### What the measurements settled

- **A `__name__` pattern in the custom allowlist collects.** `matches: [__name__=~"ovs_.*"]` took
  `ovs_*` from 0 to 86 names across all three clusters, for one line, reverted afterwards. So
  widening is cheap and fleet-wide.
- **`names:` works too**, proven in production by the three DCGM metrics since 2026-10-20.
- **An added pattern cannot narrow.** Prometheus joins `match[]` selectors with OR, so a selector
  added next to the 230 can only union with them. That is an argument about adding, not proof that a
  replaced selector could never restrict its own selection.
- **Using `matches:` as a general name pattern is not documented.** The key itself is, and the hub's
  own default list carries 13 such entries, but the guide shows `matches` only inside `collect_rules`
  with `__name__` pinned to one value. For the custom allowlist it documents `names` and
  `recording_rules`. Measured on ACM 2.17.3, see [measurements.md](measurements.md).
- **Metrics can arrive more than once per cluster**, by up to three transport paths and, inside one
  of them, from two ServiceMonitors scraping the same pods. A naive `count by (cluster)` counts those
  series, not distinct subjects, and so overcounts when read as a count of them. Query patterns in
  [querying.md](querying.md).


## Decision

**Keep the MCO allowlist as the model for central collection, and do not narrow local collection to
match it.**

The allowlist stays for the reason it was picked: it was the collection model used in MOC 1.0, in
production. We have since added to its contents, so this is the same model rather than the same
configuration. What this ADR adds is that keeping it costs less than assumed, and that central and
local selection are deliberately different.

Three selections exist and are often conflated. This ADR decides the third, and records that no
alignment of the second follows from it:

| selection | governed by | scope |
|---|---|---|
| HCP control plane metrics | `sre-metric-set`, as `metricRelabelings` on 16 ServiceMonitors in `clusters-<name>` | which control plane metrics survive the scrape, on the hub |
| local workload metrics | UWM, and whichever ServiceMonitors or PodMonitors exist | which configured targets a cluster scrapes for itself |
| central collection | **MCO allowlist** | which locally available metrics reach the hub |

What the hub buys is the comparison: every cluster in one query, grouped `by (cluster)`. The hub is
in it too, imported by ACM as `local-cluster` and sending against the same allowlist, so
`cluster:capacity_cpu_cores:sum` answers for infra and every workload at once. **All clusters, the
named metrics** — per cluster the intersection of the list and what that cluster exports, which is
why a cluster without GPUs has no `DCGM_*` although the list names it.

### Why not rebuild a drop list in MCO

`-name` removes an individual default metric, documented, so single exclusions exist. What MCO has no
form for is a **global drop rule that overrides the existing selectors**: an added `match[]` selector
is OR-ed with the 230 already there, so as an additional selector it can only widen. Reproducing
exclusion would mean replacing those selectors, which is a different change from editing a list.

### Why the gap is maintenance, not technology

Editing the selection is routine work and does not reopen this decision. CCI-MOC/oac-apps#140 is
exactly that: three names added, documented mechanism, no change of model. That holds with `names:`
alone, which is what the argument rests on.

A pattern makes a bulk addition more convenient — `matches: [__name__=~"ovs_.*"]` took `ovs_*` from 0
to 86 names across all three clusters, see [measurements.md](measurements.md) — but it is a
convenience on top, not the reason the model is affordable.

What stays true is that a metric **no existing selector matches** does not reach the hub, and
nothing reports that it is missing. A pattern shifts where that line sits, it does not remove it.

### Why local collection stays broader

Aligning the two would mean governing local collection by an allowlist as well, one model and one
kind of edit. Rejected, because the trade is bad:

| | today | local collection allow-only |
|---|---|---|
| metric allowlists to maintain | 1 (MCO) | 2 |
| a forgotten metric is missing | at the hub | at the hub **and on the cluster** |
| a new metric on an already scraped target | there locally, for the configured retention | only after somebody names it |

The third row is the point, and it needs stating precisely. A new exporter is **not** automatically
collected: it needs a ServiceMonitor or PodMonitor, and local filters and limits still apply. What
local collection gives for free is narrower and still valuable — **a new metric from a target that is
already scraped needs no central approval to be available locally**, for the retention that stack is
configured with, today 15d on the workload clusters. For a project that is the difference between
debugging now and filing a request.

This is also where the HCP drop list does **not** apply. `sre-metric-set` governs the control plane
ServiceMonitors on the hub, not project exporters in UWM, so nothing about it would change if local
collection were narrowed. The two are separate levers and the argument for keeping local collection
broad rests on UWM alone.

Ownership matches the split: the control plane is ours to run but the vendor's to shape, and the drop
list is the shape it ships with. What each cluster sends to the hub is our selection.

Not in scope: what the HCP `metrics-proxy` fetches on the hub-to-hosted-cluster hop. That list is
pinned by the operator, a transport limit rather than a selection one.

### Caveat on the pattern

Using `matches` as a **general name pattern in the custom allowlist** is measured behaviour on ACM
2.17.3, not a documented use. The guide documents the custom allowlist with `names` and
`recording_rules`, and shows `matches` only for dynamic SNO metrics with `__name__` pinned. Whether
Red Hat would treat a regression here as a bug is a support question we have not asked. Our chart
renders only `names:`, so a pattern needs a chart change first.

ACM 2.17 also documents a migration away from the allowlist resource, §1.11.12, with an
`allowlist-migration` CLI converting it to `ScrapeConfig` and `PrometheusRule`, stated reason being
scalability. It does **not** say the allowlist is deprecated or superseded; we looked.

Hence the rule: **a pattern is a convenience, never the only thing standing between us and a metric
we need.** A metric something depends on — a dashboard, an alert, billing — gets named. If the
pattern stops working, the fallback is more entries in `names:`, documented and already rendered by
the chart, and the decision above stands unchanged.


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

**By keeping the allowlist** we keep what we know: a bounded set of names and the collection model
MOC 1.0 has run for a long time. We keep the gap as well. A metric that exists on a cluster cannot be
queried centrally until a selector matches it, and nothing tells us when that happens.

**Bounded names are not bounded volume.** The allowlist caps which names arrive, not how many series
they carry: one permitted name can grow without limit through new label values. So the two counts
describe the breadth of the selection and neither the share of ingested data nor the share of
operational value, and they are not a ratio. Cardinality and ingestion still need watching on their
own, and the allowlist only makes that easier, not unnecessary.

**The measurements illustrate the difference in selection breadth, not its cost.** What that
difference costs in practice we have not quantified: how often somebody needs a metric that is not
there, and what the detour costs them. Every new exporter or operator means deciding whether we want its
metrics centrally, and that is easy to forget.

**Closing the gap is cheap to configure, noticing it is not.** Adding a name is one list entry, and
a pattern brought all metrics matching a prefix in one line, 86 `ovs_*` names from three clusters.
Cheap here means configuration effort: the storage and ingestion a wider selection costs is not
something we measured. So the work is not in the editing, it is in somebody realising there is something to edit,
and effort is better spent on noticing than on the list.

**The allowlist does not stop a project querying its own local data.** Project metrics from targets
the cluster's UWM stack already scrapes sit in that stack for the retention configured there, today
15d on the three workload clusters' UWM, whether or not a central selector matches them. That covers
local debugging. It does not cover everything a project might need centrally — cross-cluster
comparison, or history beyond the local retention — and for those the allowlist does apply. This has
to be explained that way, or the central count gets read as what a project can see.

**For the next person**, the measurements above are the starting point. What still needs answering:
whether the volume carries, what belongs on a block list, and how we would notice a
high-cardinality exporter that appears somewhere in the fleet.

**One thing we would lose** if we ever switch. Today the allowlist is a kind of silent contract
about what the hub holds. Querying stays predictable because
the set is counted out. With exclusion the set is whatever the fleet exports, which is bigger and
moves by itself.

## See also

- [measurements.md](measurements.md), the numbers behind this decision and how they were taken
- [querying.md](querying.md), why a metric can arrive more than once per cluster and how to query
  around it
- `METRICS_SET=SRE` and the `sre-metric-set` ConfigMap, the drop-based model we already run for
  hosted control planes
- ACM 2.17 observability guide, [dynamic metrics for single-node OpenShift][sno], the only
  documented use of `matches`, and [§1.11.12 Migrating custom allowlist][mig] for the migration
  path to `ScrapeConfig` and `PrometheusRule`
- CCI-MOC/oac-apps#140, which adds a custom allowlist as a named list, the shape this ADR keeps
- CCI-MOC/oac-apps#114, where the SRE drop rules turned out to cut about 40 percent rather than the
  94 percent that had been projected
- The ADR on per-project metric separation, which covers the other half of "why can somebody not see
  this metric". This one is about what we collect at all; that one is about who may read what has
  been collected. Both answers are needed to work out where to look when a metric is missing.

[rm]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#removing-default-metrics
[sno]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#dynamic-metrics-sno
[mig]: https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html-single/observability/index#migrate-allowlist-mcoa
