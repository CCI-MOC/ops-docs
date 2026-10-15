---
title: Operations documentation repository
---

## Context

We have several related problems we're trying to solve here:

1. We want a place to document policies and procedures.
2. We want a place for technical documentation
3. We want a place for architecture proposals that do not require the full RFC process
3. We want way to propose, approve, and schedule changes to our production environments.

### Out of scope

Related to some of the above issues, but not covered by this proposal:

1. We need a way to report status information about the MOC environment to our user community
2. We need a way to communicate planned and unplanned outages to our user community

## Decision

We introduce a new repository `ops-docs` inspired by the Kubernetes
[enhancements][1] repository, or the OSAC [enhancement-proposals][2]
repository. We will extend this model to cover not just technical proposals,
but also documentation about the environment, policies and procedures, and
records of live production changes.

[1]: https://github.com/kubernetes/enhancements
[2]: https://github.com/osac-project/enhancement-proposals

The repository will have the following top-level structure:

- `docs`

  Contains technical documentation about the MOC environment. Documentation in
  this directory describes the present state of the environment; it does not
  propose changes or future directions.

- `policies`

  Documents the policies and procedures we follow when operating the MOC environment.

- `adrs`

  Contains architecture decision records that don't rise to the level of an
  RFC. These documents describe technical decisions about the MOC environment.

- `production-changes`

  Contains the record of changes made to the production environment. These
  documents describe what will be changed, when the change will occur, and who
  will be responsible for implementing the change.

New documents are introduced as pull requests. We will initially use GitHub's
branch protection rulesets to establish different review requirements for the
different categories of documentation.

Each category of document may have required YAML frontmatter containing
type-specific metadata. We will enforce the required metadata through pull
request workflows, and we will enforce differing requirements for approval via
GitHub branch protection rulesets.

### Approval requirements

Each category of document may have different approval requirements. For
example, material in the `docs` directory, since it describes the existing
state of the environment, may only require the same two reviews we require
for most code changes.

A architectural decision record, since it is setting the future direction of
the environment, may require approvals from a specific team (e.g., a change
review board, or SMEs for a particular aspect of the environment).

A production change request would require a proposed date, and could
potentially be gated on established maintenance windows. It may require
approval by a specific operations team.

## Consequences

We now have a place in which to store these materials.

