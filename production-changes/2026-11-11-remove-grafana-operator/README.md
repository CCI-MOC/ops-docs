---
title: Remove the Grafana Operator from oac-prod-workload0
owner: EldritchJS
target: oac-prod-workload0
when: 2026-11-11T10:00:00-05:00
---

## Why

[oac-apps #230](https://github.com/CCI-MOC/oac-apps/pull/230) runs project
Grafana without the Grafana Operator (a community operator, not a FIPS build)
and removed `grafana-operator` from the `all-managed-clusters`
ApplicationSet. That ApplicationSet has `preserveResourcesOnDeletion: true`,
so Argo CD deleted the Application but left the operator installed and
running, no longer managed. It has already been removed this way from
oac-dev-workload0, oac-dev-workload1, oac-dev-workload2, andalusia and jetty.

## Impact

None expected. No project on oac-prod-workload0 has Grafana enabled, and
there are no Grafana resources on the cluster (checked 2026-11-11):

```sh
oc get grafanas.grafana.integreatly.org,grafanadatasources.grafana.integreatly.org,grafanadashboards.grafana.integreatly.org,grafanafolders.grafana.integreatly.org -A
# No resources found
```

What will be removed: the `grafana-operator` Subscription, CSV
`grafana-operator.v5.25.0`, OperatorGroup and namespace, and the 13
`*.grafana.integreatly.org` CRDs. No other operator is affected.

## Steps

Check again that no Grafana resources exist. If any are listed, stop:

```sh
oc get grafanas.grafana.integreatly.org,grafanadatasources.grafana.integreatly.org,grafanadashboards.grafana.integreatly.org,grafanafolders.grafana.integreatly.org -A
```

Remove the operator:

```sh
oc delete subscription grafana-operator -n grafana-operator
oc delete csv grafana-operator.v5.25.0 -n grafana-operator
oc delete operatorgroup grafana-operator -n grafana-operator
oc delete namespace grafana-operator
```

Remove the CRDs:

```sh
oc get crd -o name | grep grafana.integreatly.org | xargs oc delete
```

## Verification

```sh
oc get csv -A | grep -i grafana-operator          # expect nothing
oc get crd -o name | grep grafana.integreatly.org # expect nothing
oc get namespace grafana-operator                 # expect NotFound
```

## Rollback

Reinstall the operator from `community-operators`, channel `v5`. Nothing
on the cluster used it, so there is nothing else to restore.
