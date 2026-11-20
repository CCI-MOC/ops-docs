---
title: Policy on Policies
standards: [nist-ca, nist-cm]
responsible-team: MOC Governance
---

## Purpose

This policy defines what a policy is within this repository, what a policy document must contain, and how a policy is proposed, approved, amended, and retired.

Policies carry more weight than the other document types kept here. An Architectural Decision Record (ADR) captures a single decision at a point in time. Technical documentation in `docs` describes the environment as it currently exists. A production change request records one maintenance action. A policy, by contrast, states an ongoing rule that the Mass Open Cloud (MOC) environment and the people operating it are expected to follow until the policy itself is changed. Because a policy binds all three participating institutions, it requires the broadest agreement of any document type in this repository.

This policy also establishes a deliberate split between the rules themselves, which require full approval to change, and the operational detail that implements those rules, which does not. That split is what keeps policies stable enough to be meaningful and the environment flexible enough to operate.

## Scope

This policy applies to every policy document under the [`policies`](../) directory of this repository, including this one, and to every pull request that creates, changes, or retires such a document.

A policy's directory may also contain supporting documents, each as `<name>/README.md` in its own subdirectory and each setting `eleventyExcludeFromCollections: true` in its frontmatter. Those documents are supporting content, not policies: they are not required to carry the structure set out below, and they are not listed in the policies index.

It does not apply to ADRs, to technical documentation, or to production change requests. Those are governed by their own policies and by the approval requirements described in the repository [README](../../).

A document that states an ongoing, binding requirement is a policy regardless of which directory it is filed in. Material of that kind must not be introduced through a technical document or an ADR in order to avoid the approval requirements set out below.

## Policy

### What belongs in a policy

A policy states a requirement that persists over time, applies to more than one person or system, and is expected to be followed without being re-decided case by case. It states what must be true and who is accountable for it.

A policy does not record the reasoning behind a single architectural choice; that is an ADR. It does not describe how the environment is currently built or operated; that is technical documentation. It does not contain the step-by-step technical procedure for satisfying its own requirements; that belongs in supporting documentation, as described below.

### Required structure

Every policy is a `README.md` file in its own subdirectory of `policies`, created from [`templates/policy`](../../templates/policy/). The directory name has the format `YYYY-mm-dd-title`, where the date is the date the policy was first proposed and does not change thereafter.

The frontmatter must set:

- `title` — a friendly title for the policy.
- `responsible-team` — the team accountable for the policy, as described under [Responsible team](#responsible-team). The value must be one of the teams listed in [Designated Policy Approvers and Responsible Teams](./approvers/).
- `standards` — the compliance standards the policy relates to, where any apply.

The body must contain the following sections, in this order:

1. **Purpose** — why the policy exists and what it is meant to achieve.
2. **Scope** — who and what the policy applies to, and what falls outside it.
3. **Policy** — the requirements themselves. This is the normative text.
4. **Exceptions** — who may grant an exception to the requirements, and on what terms.
5. **Version History** — a dated record of every change made to the policy.
6. **Appendices** — normative material too long or too tabular to sit in the Policy section.
7. **Supporting Documents** — pointers to the operational material that implements the policy.
8. **Related Policies and Resources** — links to other policies and to external material.

A section with nothing in it reads `None.` rather than being omitted, so that a reader can tell the difference between a policy with no exceptions and a policy whose author forgot to consider them.

A policy does not carry its approval date in frontmatter. The date a policy was last approved is the date of the most recent `Normative` row of its Version History, so that there is only one place to update and no second copy that can drift.

### Two tiers of content

A policy document is divided into two tiers, and the distinction between them determines what it takes to change a given line.

**Normative content** is everything in the Purpose, Scope, Policy, and Exceptions sections, together with anything in the Appendices. It states what is required. Changing any of it requires the full approval process described below.

**Supporting content** is the Supporting Documents and Related Policies and Resources sections, together with the documents those sections point to. It states how a requirement is currently met and what currently satisfies it. The responsible team may add, remove, or re-point these links, and may change the documents they point to, without the full approval process.

Policies should be written so that the facts which change on someone else's schedule live in supporting content rather than in the policy. The policy states the requirement; the supporting document states the current particulars.

For example, a policy may require that production systems run a vendor-supported release of their operating system. The list of releases that currently satisfy that requirement belongs in a supporting document, so that a new release of RHEL or Windows does not require amending a policy. Similarly, a policy on onboarding states who must be onboarded, what approvals are required, and what records are kept, and points to operational documentation under `docs` for the technical steps involved in carrying it out.

A change to supporting content requires the agreement of the responsible team, recorded in a pull request with the repository's standard two reviews. Two exceptions carry a higher bar: changing an institution's designated approver or alternate requires the approval of that institution's own current designated approver or alternate, and no other institution may make that change on its behalf; and adding a team to the list of responsible teams requires the agreement of that team.

A supporting document may not create, relax, or contradict a requirement. It may only record how an existing requirement is currently satisfied. If a change cannot be made without changing what is required, it is an amendment to the policy and follows the full approval process. Any approver may object that a supporting document has begun to set policy, and may require that the material be folded into the policy itself.

### Approval of a new policy

A new policy becomes active once it arrives in the `main` branch of this repository. To reach `main` it must go through a pull request, and that pull request has the following requirements.

MOC, Boston University (BU), and Red Hat (RH) each designate one approver for policy pull requests. Any number of people from any institution may review and comment; only the designated approver records that institution's approval.

- All three institutions must approve. There is no majority: a policy cannot merge while any institution has not approved it, and no institution's approval may be substituted or waived by the others.
- The approver recording an institution's approval must not be the author of the pull request. If the author is that institution's designated approver, the institution designates an alternate approver for that pull request.
- The pull request must remain open for at least five business days after it has been announced to all three institutions, so that people who are not approvers have the opportunity to read and comment on it. The approvers need to publized the pull request to everyone who should read and comment on it based on its content. A substantive change to the normative text restarts that period; an editorial correction does not.
- A request for changes from any approver blocks the merge until that same approver withdraws it. Other approvers may not dismiss it on their behalf.

Once the last institution has approved, and before the pull request merges, the proposer makes a final commit recording the approval in the Version History table: the date approval completed, the type of change, a short description, and the pull request number in place of any `Pending` placeholder. The steps are summarised under [Approving a policy](../../#approving-a-policy) in the repository README.

### Amending a policy in place

Policies are amended in place. A revision edits the existing `README.md` in the existing directory; it does not create a new policy, a new directory, or a superseding document. The directory name and its date record when the policy was first proposed and never change, so that references to a policy, and its published URL, remain valid across every revision.

Every amendment appends a row to the Version History section recording the date on which the last institution approved the normative text, the type of change (`Normative`, `Editorial`, or `Supporting`), what changed, and the pull request that made the change. The policy as it stands in `main` is always the policy in force; the history of how it got there lives in Version History and in the repository's commit history.

An amendment to normative content carries the same approval requirements as a new policy, including the ten business day comment period and the requirement that all three institutions approve, regardless of how small the change is.

An editorial correction — a typographical fix, a formatting change, or a repair to a broken link, none of which change the meaning of the policy — may be merged with a single approval from any institution, provided the pull request is labelled as editorial. Any approver may object that a change labelled editorial is substantive, which returns it to the full approval process.

### Retiring a policy

A policy that is no longer in force is retired rather than deleted, so that references to it continue to resolve. The directory and the `README.md` remain in place. The Policy section is replaced with a statement that the policy is retired, the date on which it ceased to be in force, and a pointer to the policy that replaces it, if any. The retirement is recorded in Version History.

Retiring a policy carries the same approval requirements as adopting one.

### Responsible team

Every policy names a responsible team: the team accountable for keeping the policy accurate, for maintaining the supporting documents it points to, and for answering questions about how it is applied.

The responsible team does not have the authority to change normative content on its own. Its authority extends to supporting content, as set out under [Two tiers of content](#two-tiers-of-content).

## Exceptions

An exception to this policy requires the same approval as an amendment to it: the agreement of the designated approver from each of MOC, BU, and Red Hat, recorded in a pull request. Granting an exception in any other way would defeat the purpose of requiring broad agreement in the first place.

The one procedural accommodation available without that agreement is the editorial correction path described under [Amending a policy in place](#amending-a-policy-in-place).

## Version History

| Date | Type | Change | Pull request |
| --- | --- | --- | --- |
| 2026-10-30 | Normative | Initial version. | Pending |

## Appendices

None.

Material added to this section is normative and changes to it follow the full approval process described under [Approval of a new policy](#approval-of-a-new-policy).

## Supporting Documents

The responsible team maintains the documents listed here and may add, remove, or re-point them without the full approval process.

- [Designated Policy Approvers and Responsible Teams](./approvers/) — the current approver and alternate approver for MOC, BU, and Red Hat, and the teams that may be named as a policy's `responsible-team`. Changing who holds a role does not require amending this policy; changing the requirement that all three institutions approve does.
- [Policy template](../../templates/policy/) — the starting point for a new policy.

## Related Policies and Resources

- [ADR PRs](../2026-10-22-adr-prs/) — the equivalent approval requirements for Architectural Decision Records.
- [Approving a policy](../../#approving-a-policy) — the repository README's step-by-step summary of the process in this policy.
- [Repository README](../../) — how each category of document in this repository is created and approved.
- [Architectural Decision Records](https://adr.github.io/) — background on ADRs, for the distinction drawn under [What belongs in a policy](#what-belongs-in-a-policy).
