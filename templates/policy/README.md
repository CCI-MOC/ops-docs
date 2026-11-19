---
title: A friendly title for your policy
# The team accountable for this policy. See "Responsible team" in the
# policy on policies.
responsible-team: Which team is accountable for this policy?
# standards: [nist-ca, nist-cm, ...]
---

## Purpose

Why does this policy exist, and what is it meant to achieve? State the problem
it addresses and why a binding rule, rather than documentation or an ADR, is
the right instrument.

## Scope

Who and what does this policy apply to, and what falls outside it? Name the
systems, the people, and the institutions it binds, and say explicitly what it
does not cover.

## Policy

The requirements themselves. This is the normative text: state what must be
true, who is accountable for it, and what happens when it is not met.

Write requirements that persist over time. Facts that change on someone else's
schedule — supported versions, current tooling, who currently holds a role —
belong in a supporting document that this section points to, not here.

### Use subsections for distinct requirements

Break the requirements into `###` subsections so that each can be linked to and
discussed on its own.

## Exceptions

Who may grant an exception to these requirements, and on what terms? If no
exception is possible, say so here rather than leaving the section out.

If this section does not apply, it reads `None.` so that a reader can tell the
difference between a policy with no exceptions and a policy whose author forgot
to consider them. The same applies to every section below.

## Version History

Add a row for every change. The date is the date approval completed. The type
is `Normative`, `Editorial`, or `Supporting`, which records what approval the
change required. A policy carries no approval date in its frontmatter: the date
it was last approved is the date of the most recent `Normative` row below.

Leave the pull request as `Pending` while drafting. The proposer replaces it,
and fills in the date, in the final commit before merge.

| Date | Type | Change | Pull request |
| --- | --- | --- | --- |
| 2026-10-15 | Normative | Initial version. | Pending |

## Appendices

None.

Material added to this section is normative, and changes to it follow the same
full approval process as the Policy section.

## Supporting Documents

The responsible team maintains the documents listed here and may add, remove,
or re-point them without the full approval process. A supporting document may
record how a requirement is currently satisfied; it may not create, relax, or
contradict one.

- Link to the operational documentation, run books, and `docs` pages that
  implement this policy, each with a short note on what it covers.

A supporting document kept in this policy's own directory goes in its own
subdirectory as `<name>/README.md`, so that the link `<name>/` resolves both
on GitHub and on the published site, and sets
`eleventyExcludeFromCollections: true` in its frontmatter so that it is not
listed in the policies index as a policy in its own right.

## Related Policies and Resources

- Link to other policies in this repository that bear on this one.
- Link to external standards, vendor documentation, or background reading.
