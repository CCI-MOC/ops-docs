# A Taxonomy for Issue and PR Labels

This is a proposal for formalizing the labels we use in our
repositories in order to make them more meaningful and more useful.

## Problem Description

We use issue and pull request labels to indicate certain metadata
about these items. Some labels are used to position an issue along a
scale (is this high or low priority? Is this a big or small issue?).
Other labels are used to group together issues that share some common
aspect ("These are website issues" or "These issues need better
descriptions").

Our collection of labels has grown organically over time, and as we
have created new labels they have not always been propagated to all
of our repositories. This leads to two problems:

- We can't always use labels effectively in our sprint planning
  because sometimes the labels aren't available when we want them.

- It can be difficult to differentiate between different types of
  labels.

## Policy

I would like to propose a common label taxonomy to adopt across all of
our repositories. The labels will be organized around several axes,
indicated by prefixes on the label name. For example, labels that
indicate priority will live on the `priority` axis, and will be
named like `priority/critical` or `priority/medium`. We should start
with the following axes that cover most of our existing labels:

- **Type**

  The `type` axis describes in general terms the sort of work required
  to resolve the issue.

  - `type/bug`
  - `type/enhancement`
  - `type/documentation`
  - `type/research`
  - `type/discussion`

- **Status**

  The `status` axis describes the current condition of the issue or
  pull request. This is a multi-valued axis (e.g., an issue may be
  both `accepted` and `blocked`).

  - `status/blocked`
  - `status/wontfix`
  - `status/invalid`
  - `status/accepted`

- **Topic**

  The `topic` axis is groups to group issues and pull requests that
  share some common aspect.

  - `topic/monitoring`
  - `topic/gitops`
  - `topic/policy`
  - `topic/mghpcc`
  - `topic/website`

- **Flag**

  The `flag` axis is used to draw attention to an issue or pull
  request.

  - `flag/help wanted`
  - `flag/needs description`
  - `flag/added post planning`
  - `flag/good first issue`
  - `flag/question`

- **Priority**

  The `priority` axis is used to describe the criticality of an issue
  or pull request.

  - `priority/medium`
  - `priority/high`
  - `priority/critical`

As soon as
[cci-moc/ops-issues#241](https://github.com/CCI-MOC/ops-issues/issues/241)
is complete we will also add something analogous to a `size` or
`effort` axis.

## Alternatives & History

None

## Implementation

### Author(s)

Primary author:
  - Lars Kellogg-Stedman <lars@redhat.com>

Other contributors:
  - None

### Milestones

This policy will go into effect as soon as this policy is approved by
the ops team.

### Work Items

- Configure tooling to apply our label taxonomy to all repositories
  involved in our project planning processes.

## References

Several people have written about label taxonomies specifically in the
context of GitHub:


- [Sane Github
  Labels](https://medium.com/@dave_lunny/sane-github-labels-c5d2e6004b63),
  by Dave Lunny
- [GitHub Labels that are logical, colorful and
  sensible](https://seantrane.com/posts/logical-colorful-github-labels-18230/),
  by Sean Trane Sciarrone
- [How we organize GitHub issues: A simple styleguide for
  tagging](https://robinpowered.com/blog/best-practice-system-for-organizing-and-tagging-github-issues),
  by the folks at Robin


## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
