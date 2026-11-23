---
title: GitOps Reconciliation and Change Control
standards:
- nist-cm
---

## Context

RFC15 was created with the following question:

> Spun out of RFC 09 - OpenShift IAC Architecture: How should MOC 2.0 reconcile
> cluster state against Git, and what change-control process governs the
> changes that reconciliation enforces?

This question as posed is misleading: we manage the configuration of
things other than clusters, so we should consider change control in that
broader context.

I believe that the bulk of the answer to this question is simply a description
of tools and processes selected by RFC 9 and 10 (and our subsequent
implementation decisions), which makes it more appropriate for an ADR rather
than an RFC.

## Decision

### Change control

Our change control process is built around GitHub pull requests. For most repositories, the process look like this:

1. Automatic tooling is used to lint and otherwise validate changes.
2. Two approving reviews are required before the changes can merge.

In some repositories, we may require more reviewers, and we may require reviewers from specific teams. The required reviews, CI checks, and other repository policy is itself all managed by the [moc-github] repository and applied automatically when changes are made and approved.

[moc-github]: https://github.com/cci-moc/moc-github

### Reconciliation

There are broadly two different mechanisms we use to reconcile desired state against a live environment.

#### ArgoCD

ArgoCD is a continuous deployment tool available with OpenShift as part of
the "OpenShift GitOps" package. It is an open source product that can also
be installed into any Kubernetes cluster. We use ArgoCD to manage both our
OpenShift clusters and our Amazon EKS cluster(s).

1. ArgoCD monitors Git repositories for updates (with a default poll
   interval of 3 minutes). When it detects changes in the repository, it
   updates its local view of the desired state.

2. ArgoCD watches Kubernetes resources that it manages. When resources
   change, ArgoCD immediately re-applies the desired configuration.

It is important to note that ArgoCD only manages the configuration of
resources for which it is responsible: it will not notice if someone
creates a new resource directly on the target cluster, and in some cases,
it will not replace changes to managed resources if they do not conflict
with the fields it is managing.

##### Viewing configuration drift

The ArgoCD console (and the `argocd` command line tool) allow an
administrator to view a diff between the live state and the desired state.

##### Alerting

We do not have any alerts configured. ArgoCD does have a [notification
engine] that can be configured to send alerts when ArgoCD performs
automatic reconciliation due to configuration drift in the target cluster.

[notification engine]: https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/

##### Emergency maintenance (break-glass)

It is possible to temporarily (or permanently) stop ArgoCD from syncing an Application. Doing so will permit someone with appropriate privileges to make manual changes to the target cluster without having those changes reverted by ArgoCD. In our environment, the most effective method for doing so is my implementing a deny [sync window].

[sync window]: https://argo-cd.readthedocs.io/en/stable/user-guide/sync_windows/

#### GitHub workflows

Many of our repositories rely on GitHub workflows to apply the desired
state to a target environment. An incomplete list of examples includes:

- [moc-github](https://github.com/cci-moc/moc-github), which manages our
  GitHub organization
- [moc-keycloak](https://github.com/cci-moc/moc-keycloak), which manages
  our Keycloak configuration.
- [moc-dns](https://github.com/cci-moc/moc-dns), which manages static DNS
  records in Route 53

In these cases, the desired state is only compared with the target state
when configuration changes are applied. We could arrange to re-apply the
desired state with [periodic workflow runs].

[periodic workflow runs]: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

Note that the [SDLC policy][policies/2026-10-27-sdlc] suggests that most of
our GitHub workflows are incompatible with a NIST compliant environment, so
expect these mechanisms to change in the future.

[policies/2026-10-27-sdlc]: https://ops-docs.massopen.cloud/policies/2026-10-27-sdlc

##### Viewing configuration drift

There is no single mechanism available for viewing configuration drift.

For OpenTofu/Terraform based repositories, someone with appropriate
credentials can run `tofu plan`, which will show the difference between the
desired state and the live state. The output of `tofu apply`, which
actually reconciles the changes, also shows this information. Our OpenTofu
workflows will generally include the output of `tofu apply`.

For Ansible-based workflows, there is no convenient "show me the
difference" mechanism. One can inspect the output of an Ansible run to
determine if it has made any changes, but the utility of this  depends on
the structure of the playbook.

##### Alerting

We do not have alerting configured for any of our GitHub workflows. One can
configure notification logic in individual workflows (e.g., using the [webhook
action](https://github.com/marketplace/actions/webhook-action), the official
[Slack notification action](https://github.com/slackapi/slack-github-action),
etc).

##### Emergency maintenance (break-glass)

It is possible to disable individual GitHub workflows via the UI.  This would
permit someone with appropriate privileges to make changes to the target
environment without having those changes reverted by a subsequent workflow run.

## Consequences

This document is not proposing a change or particular decision; it is
describing the state of the current environment.

## See also

- <https://docs.github.com/en/actions>
- <https://argo-cd.readthedocs.io/en/stable/>
