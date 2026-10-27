---
title: Separate project metrics with one Grafana per project
---

## Context

Projects on OAC/MOC 2.0 need to see their own metrics and only their own. The obvious way, the console
dashboards that come built in, does not give us that. The reason is specific enough to write down.

`thanos-querier` listens on two ports, and they behave differently:

| Port | Name | Behaviour |
|---|---|---|
| 9091 | `web` | **Does not filter.** Measured: 19 namespaces returned, with and without a `namespace` parameter, identical result |
| 9092 | `tenancy` | **Filters**, and a query cannot override the namespace |

Port 9092 is a chain of two proxies in front of the querier:

```
9092 (TLS) -> kube-rbac-proxy -> 127.0.0.1:9095 -> prom-label-proxy -> 127.0.0.1:9090 (thanos-query)
                    |                                     |
        checks the token's k8s RBAC          enforces --label=namespace
```

Read off the running pod on `oac-prod-workload0`: `kube-rbac-proxy` runs with
`--secure-listen-address=0.0.0.0:9092` and an allow-list of query paths, `prom-label-proxy` with
`--label=namespace` and `--error-on-replace`.

`--error-on-replace` matters, but on its own it is not the authorisation. It makes the proxy reject
a conflicting selector instead of rewriting it. Which namespace a caller may ask for is decided
before that, by the identity in the request, and prom-label-proxy says itself that it does no
authentication or authorisation.

So the full chain in our setup, read off the chart and the cluster:

| | |
|---|---|
| identity | `grafana-sa`, one service account per project namespace |
| its rights | `RoleBinding grafana-view` → ClusterRole `view`, **bound to the project namespace only** |
| cluster-wide | one ClusterRoleBinding, `system:auth-delegator`, for the oauth-proxy's SAR path, not for queries |
| the namespace asked for | `customQueryParameters: namespace=project-<name>`, set in the datasource |
| why it cannot be changed | the datasource is `editable: false`, and `--error-on-replace` rejects a query that carries a different namespace |

The guarantee rests on all five, not on the port alone.

### Why not Perses

The Cluster Observability Operator (COO)'s UI plugin gives the console a dashboard page built on Perses, and that was the first plan.
It cannot separate projects, and not as a configuration gap we could close.

In COO 1.5.3, the version installed here, the Perses datasource is created pointing at port
**9091**, in `pkg/controllers/uiplugin/prometheus-global-datasource.go:37`, and the CRD field
`spec.monitoring.perses` has one key, `enabled`. So there is nothing to point elsewhere. Perses
does have namespace-scoped resources and RBAC for dashboards; what it does not have here is a
datasource that filters the metrics it queries.

We measured 9091 instead of trusting what we read: with our own token it returned all 19
namespaces, with and without a `namespace` parameter. That is one token and one query, so it shows
the port does not filter, not what every Perses user sees. For an operator identity that is fine,
for a project it would be wrong.

This was decided the other way round once, on 2026-09-02, with the reasoning that "Perses gets
tenancy from the namespace mapping for free". **That reasoning was wrong**, Perses has no namespace
mapping, and the decision was reopened and re-decided on 2026-09-08.

### Perses stays

The paragraph above reads like a verdict on Perses, and it is not. Perses is enabled in the console
on our clusters and stays there. Three reasons, only the first is about tenancy:

1. **For the fleet view it is the right tool.** Seeing everything is the job of an operator
   dashboard, and that 9091 returns all namespaces is correct for this reader. The same property
   that makes it unusable for a project makes it usefull here.
2. **Two ways in, for two kinds of user.** Somebody with cluster wide access gets dashboards in the
   console that is open anyway, with nothing to deploy. A project gets its own Grafana. To give
   people the choice is worth something by itself, and neither of the two has to serve both
   audiences. This was never written down before, only "both now run, for different jobs" in the
   notes from 2026-09-08, so this ADR is where it gets recorded.
3. **It is already integrated.** `openshift/monitoring-plugin` depends on `@perses-dev/*` and
   renders the Dashboards tab with it, while Metrics and Alerting use Victory. So the console ships
   a dashboard surface either way, and enabling the UI plugin only exposes the tab.

So this ADR is not "Grafana instead of Perses". It is both, for different views.

## Decision

**One Grafana instance per project namespace**, with a datasource pointing at
`https://thanos-querier.openshift-monitoring.svc:9092`, shipped by the `user-projects` chart and
opt-in per project. Implemented in CCI-MOC/oac-apps#14, merged 2026-09-28.

Worth being explicit where the separation happens, because it is easy to read this the wrong
way: **Grafana does not separate anything here.** It never sees more than its own project. The
instance is unrestricted inside, one organisation, one datasource, and the limit sits in front of
it in the proxy chain on 9092. We did not configure Grafana to filter by namespace, we gave it a
datasource that cannot return anything else.

The supporting choices, each of which could be made differently:

- **Per project, not one shared Grafana with orgs.** Separation is then the cluster's, enforced by
  RBAC and `--error-on-replace`, rather than Grafana's own org model. Everything else in this repo
  separates by Kubernetes RBAC, so this keeps one mental model instead of two.
- **The CRs live in `user-projects`, not in a chart of their own.** A separate chart would hold a
  second copy of the project list and the two would drift. `user-projects` already owns the
  per-project loop.
- **A route with an `oauth-proxy` sidecar**, the service account as the OAuth client. It reuses the
  `project-<name>-edit` groups that exist anyway, needs no Keycloak client per project, and makes
  route access and metric access test the same RBAC.
- **Opt-in, off by default.** A project without a `grafana:` block renders exactly as before, no
  pod and no quota used. Adding the template to the chart must not hand six existing projects a
  Grafana they never asked for.
- **Dashboards are chart resources, not hand-built per project.** `project-overview` is one
  `GrafanaDashboard` in `user-projects`, rendered into each project namespace. Because the
  datasource behind it is scoped by the proxy, the same dashboard definition shows a different
  project its own data without being edited. Write a panel once, every project that opts in gets it,
  and nobody has to maintain six copies that drift.
- **No volume.** "No PVC" sounds like the metrics are not kept. They are, just not here: the
  platform Prometheus on each workload cluster holds 15 days on a 32Gi volume, UWM another 20Gi,
  and Grafana queries that through the tenancy port.

  Grafana does keep state of its own, in a database: users, datasources, dashboards, preferences.
  We run it without a volume anyway, which means everything we need comes back declaratively from
  the CRs after a restart, and anything else is allowed to be lost. **That has a consequence for
  projects: a dashboard built in the UI does not survive.** Dashboards belong in git. If a project
  needs to keep its own, this is the point to revisit. A project that needs Explore or wants to
  keep its own dashboards sets `grafana.editable: true`. That switches the anonymous role to Editor
  and adds a 512Mi volume, rollout `Recreate` because the volume is ReadWriteOnce. Editor and
  volume come together on purpose: an Editor saving into `emptyDir` loses everything with the next
  pod. Neither Viewer nor Editor may change datasources in Grafana OSS, that is org admin only, so
  the tenancy is unaffected.
- **No alerting in Grafana**, a separate decision from the volume. Alerting belongs to the
  platform: Prometheus evaluates `PrometheusRule`, Alertmanager routes what fires, both already
  running and both tenant-aware. Grafana alerting would be a second path next to the one OpenShift
  ships. With `editable` it is switched off in the config as well
  (`unified_alerting.enabled: "false"`), for a second reason: an Editor could add a webhook contact
  point, and Grafana would send it from inside the cluster with open egress.
- **A community operator, knowingly.** `grafana-operator` v5 only ships in `community-operators`,
  while every other operator here comes from `redhat-operators`. This is a deliberate exception. The
  fallback, if community support turns out to be unacceptable for something projects rely on, is a
  plain Deployment without the operator, at the cost of the dashboard CRs.

### What we did not pick

**One shared Grafana with Grafana organisations.** Cheaper, one pod and one URL for everybody.
Organisations are core Grafana and work in the community edition, no Enterprise licence needed:
dashboards, folders, datasources, alerts and service accounts separate per organisation, and
`org_mapping` in Generic OAuth puts a Keycloak group into the right one. Team Sync and
per-datasource permissions are Enterprise, neither is needed here.

Two reasons against. First, Grafana would hold the credentials of several projects at once, so
their correct assignment inside Grafana becomes security relevant. A misconfigured organisation or
a shared datasource lets one project see another.

Second, our tooling cannot do it. The `grafana-operator` has no CRD for organisations, and
`GrafanaDatasource.spec.datasource.orgId` carries "Deprecated field, it has no effect". Dashboards
and folders have no org field at all, so everything lands in the default organisation.
Organisations per project, each with its own datasource and token, would have to be created past
GitOps through the Grafana API or a job of our own. That is a step backwards from today, where
every object is an operator CR.

If project count makes the per-project cost hurt, this is still the option to come back to, with
the operator gap as part of the price.

**Per-cluster separation instead of per-namespace.** Simpler, but it does not match OAC/MOC 2.0: the
projects share `oac-prod-workload0`, so the dividing line is the namespace. Not really a choice, it
is what the environment is.

**AI Telemetry with the Prometheus Keycloak Proxy**, how MOC 1.0 solved this with Chris Tate. It
separates more than we do and one level higher: hubs, tenants, clusters and projects, Keycloak
groups created per hub and per tenant, one proxy per hub sharing a realm with the application. For
a provider with several hubs and real tenants that is the stronger model, and it ran in production.

The reason against is ownership, not technique. As far as I know it is no official Red Hat feature
or product, so support and maintenance would sit with our team. For a component between projects
and their data, carrying an authorisation decision, that is a commitment to make deliberately. The
per-project Grafana leans on supported pieces instead: the OpenShift proxy chain, the oauth-proxy
sidecar, the cluster's RBAC.

If OAC/MOC 2.0 grows several hubs or needs tenants above the project level, this is the design to look at
again, with the support question answered first.

## Consequences

**The separation is enforced outside Grafana**, by the proxy and by RBAC, not by the application.
A dashboard with the wrong query does not leak across projects, because the proxy rejects it rather
than Grafana deciding to be careful.

Verified: the datasource points at 9092, it is `editable: false`, the service account's `view` is
bound to its own namespace, and only `auth-delegator` is cluster-wide. **Not** verified: that
`grafana-sa` gets nothing useful out of 9091, and that a hand-made query for another namespace is
refused. Both need impersonating the service account, which this account may not do on the workload
cluster. So this is a well-founded expectation, not a proven one.

**The cost is one Grafana pod plus one `oauth-proxy` sidecar per participating project**, against
that project's own quota. In numbers, from the chart:

| | requests | limits |
|---|---|---|
| Grafana | 100m CPU, 256Mi | 500m CPU, 512Mi |
| `oauth-proxy` sidecar | 50m CPU, 64Mi | 200m CPU, 256Mi |
| **per project** | **150m CPU, 320Mi** | **700m CPU, 768Mi** |

Deliberately small, and the sidecar needs its own entry because a container without resources picks
up the project `LimitRange` default of 1 CPU and 2Gi. No storage, see above.

If project count grows faster than expected, the shared-Grafana model comes back onto the table,
and with it the separation moving into the application.

**Two open questions nobody decided**, and they are not the same one. The pods sit in the project
namespace and consume from its quota, and what exactly they consume depends on whether the quota
caps requests, limits or both.

1. **Is the quota raised when Grafana is enabled?** If not, a project trades 150m CPU and 320Mi of
   its own workload for the dashboard. The quota does not shrink, its remaining capacity does.
2. **Are those resources billed to the project?** Separate question: the pod consumes quota either
   way, billing only decides who pays for it.

For raising the quota: observing your own workload is part of running on the platform, and making
people pay for it discourages the thing we want. Against billing it: 150m CPU is below the noise of
any billing unit. Both are policy, not technical, and better decided before the first project asks.

**It means also one URL per project**, every Grafana gets its own route in its own namespace.
There is no single address today where we can send everybody, so somebody has to tell a project
where its dashboard lifes. A landing page or a redirect could give one entry point without merging
the instances, we just have not built it.

**The upside sits on the same mechanism.** A dashboard written once in the chart works for every
project, because the scoping happens in the datasource and not in the dashboard. Adding a panel is
one change in one file, and a new project that opts in gets the current set with nothing to copy.

**We run two dashboard tools for two jobs.** Perses in the console on 9091 for the cluster-wide
view, Grafana per project on 9092. Intended, and still real operational work: two things to upgrade,
two things to explane. One correction to how I put it earlier: 9091 on a workload cluster shows that
cluster, not the fleet. The fleet view is the hub's.

**With `editable`, everybody who passes the proxy is the same anonymous Editor.** That includes
`open-accelerator-admins` through `cluster-reader`, and project members who only have view. Changes
cannot be attributed to a person.

**We depend on a community operator** for something projects use directly. Known, accepted, with a
named fallback.

**A project dashboard is only as good as the platform Prometheus under it**, and that is not part of
this chart. `cadvisor` lives in the platform instance, not in user workload monitoring, so the
container metrics the `project-overview` panels draw come from there. On a cluster where the platform
Prometheus mounts `emptyDir`, a project gets a dashboard that works and shows the age of the pod.
Nothing in Grafana reports this, and Argo is green either way.

That is a per-cluster property, so it has to be checked per cluster rather than assumed from this
decision. Today the three workload clusters hold 15 days on a 32Gi volume, which is what the numbers
above rely on.

## Open points

1. **Nothing is built for a tenancy demo yet.** Showing two projects that cannot see each other is
   the thing a reviewer will ask for, and it does not exist.
2. **The upstream gap in Perses is unreported.** An issue making the datasource port configurable
   was drafted and never opened. If that lands, the per-project Grafana becomes optional rather than
   necessary, which would be a simplification worth having.
3. **Per-project resource limits are small on purpose** and have not been tested under real
   dashboard use.
4. **The quota question above needs an owner.** It is not blocking anything today, because few
   projects have Grafana enabled, and it becomes awkward the first time somebody notices.
5. **Whether AI Telemetry is supportable** was never actually asked, I am going on what I know. If
   somebody checks and it turns out there is a support path, the alternative above deserves a real
   comparison rather than the short treatment it gets here.
6. **SQLite on `pure-fb-nfsv4` works, but not under a real project yet.** The concern was file
   locking, SQLite being known to be fragile on NFS. Tested on dev-workload0 on 2026-10-20 with
   `grafana/grafana:11.3.0`: the export mounts `nfsvers=4.1` with no `nolock`, the pod reports
   `local_lock=none`, the database was created and the migrations ran, and after deleting the pod the
   new one reopened the same file and logged `migrations completed, performed=602, skipped=6`. No
   stale lock. What is still untested is a real project with `editable: true` and somebody actually
   saving dashboards, rather than one pod cycled by hand.
7. **Nothing warns when the platform Prometheus below a project has no volume.** The dashboard looks
   healthy and the panels are simply short. A check on the cluster, or a panel that shows the oldest
   sample it can see, would make it visible. Neither exists.
8. **The negative access test is missing, and it is the one that matters.** Project A reads its own
   data, project B reaches neither through a hand-made namespace query nor through 9091 with the
   project's service account. We could not run it: impersonating a service account is Forbidden for
   this account on the workload cluster. Somebody with those rights should, and the result belongs
   in here.

## See also

- CCI-MOC/oac-apps#14, which implements this
- The ADR on central metric collection, which covers the other half of "why can somebody not see
  this metric". That one is about what reaches the hub at all; this one is about who may read it.
  Both answers are needed to work out where to look when a metric is missing.
- The ADR on running the Prometheus TSDB on FlashBlade NFS, for the volumes these dashboards read
  through and why upstream does not stand behind that filesystem
- `pkg/controllers/uiplugin/prometheus-global-datasource.go` in the Cluster Observability Operator,
  for the hardcoded Perses datasource port
- The MOC 1.0 metering and billing design, section "How AI Telemetry multi-tenancy and
  authorization works", for the hub and tenant model built with the Prometheus Keycloak Proxy
