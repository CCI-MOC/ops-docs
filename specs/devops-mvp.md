# MOC devops minimal viable product

We want to ensure that our systems management procedures meet a minimal set of
modern best-practice requirements. Specifically, we want to reach the point
that:

- System configuration is managed via configuration management tooling.

- Configuration changes are introduced via pull requests so that (a) there is
  at least the opportunity (though not initially a requirement) to review
  changes before they are activated and (b) there is a record of why changes
  were made and who made them.

- We are only making manual changes on systems in exceptional situations.

## Problem Description

With several people managing an ever increasing set of systems, it
can be difficult to keep track of how any particular system has
reached a given state. Currently, our systems are configured through
a combination of:

- Provisioning scripts (kickstart/foreman/cloud-init/etc)
- Post-install configuration management tooling (ansible/puppet/etc)
- Manual changes

In many situations, the reason why a particular configuration exists
has either been lost to time, or exists only in the memory of the
person who made the change.

## Policy

We propose immediately adopting the following goals:

1. Manage system configuration via configuration management tooling.

   All system configuration changes should be made via the execution
   of a script, CM tool, or other automated (but manually triggered)
   fashion.
   
   It is explicitly *not* the goal of this document to select a
   specific toolset. We recognize that different environments may
   impose their own particular requirements on tool selection.

1. Only make manual changes to systems in exceptional situations, and
   backport those changes to configuration management as soon as
   possible.

   There are situations in which manual configuration changes are
   necessary: there may be a critical problem that needs an immediate
   fix, or the operator may be testing out configurations while
   diagnosing a problem.

   When the exceptional situation has been resolved, any changes
   should be ported back into the configuration management tools so
   that future changes do not result in regressions caused by
   overwriting manual changes with configuration from the repository.

1. Introduce all configuration changes via a pull request workflow.

   Using a pull-request workflow gives other members of the operations
   team the chance to review proposed changes. It also provides us
   an integration point with continuous integration and automated
   deployment mechanisms, if we choose to adopt such technology.

   Because we do not wish for this policy to become a roadblock, we
   may not initially require explicit approval of changes as part of
   the workflow (although it would be nice to get to that point in the
   future).

## Alternatives & History

N/A

## Implementation

### Author(s)

Primary author: <lars@redhat.com>

### Milestones

We expect to implement these procedures on all work started after the date this
policy is merged.

### Work Items

- Establish how we will document the mapping between systems/clusters and
  configuration repositories

## References

- <https://aws.amazon.com/devops/what-is-devops/>

  An overview of devops from Amazon Web Services.

- <https://azure.microsoft.com/en-us/overview/what-is-devops/#practices>

  An alternative take on the topic from Azure.

- <https://www.gitops.tech/>

  This is forward thinking, but it has a good overview of constitutes "gitops"
  and how that differs from simply "infrastructure as code with version
  history".

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
