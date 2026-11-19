# MOC Operations Documentation

This repository is the central home for documentation related to operating the
MOC environment. It brings together architecture decision records, technical
documentation, policies, and records of production changes in a single place,
with each category managed through pull requests and reviewed according to its
own approval requirements.

The canonical URL for this repository is <https://github.com/cci-moc/ops-docs>.
The documentation in this repository is published to
<https://ops-docs.massopen.cloud>.

## Architectural Decision Records (ADRs)

The [`adrs`](adrs) directory contains Architectural Decision Records. Quoting from <https://adr.github.io/>:

> An Architectural Decision (AD) is a justified design choice that addresses a
> functional or non-functional requirement that is architecturally significant.
> An Architectural Decision Record (ADR) captures a single AD and its
> rationale; Put it simply, an ADR can help you understand the reasons for a
> chosen architectural decision, along with its trade-offs and consequences

### Creating a new ADR

1. Copy the ADR template to a new subdirectory of [`adrs`](adrs). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```sh
    cp -a templates/adr adrs/2026-10-15-ops-docs-repository
    ```

2. Edit the `README.md` file in the new directory to create your ADR.

3. Submit a pull request with your changes.

### Approval

TBD.

## Technical Documentation

The [`docs`](docs) directory contains technical documentation. Unlike an ADR, which documents a single technical decision, documentation in the `docs` directory describes the existing state of the environment. It may contain how-to documentation, run books, network diagrams, and other such material.

### Creating a new technical document

1. Copy the docs template to a new subdirectory of [`docs`](docs). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```sh
    cp -a templates/doc docs/2026-10-15-oac-prod-networking.md
    ```

2. Edit the `README.md` file in the new directory to create your document.

3. Submit a pull request with your changes.

### Approval

Because documents in the `docs` directory describing what currently exists and do not require any decisions, they only require our standard two reviews before merging.

## Policies

The [`policies`](policies) directory contains documentation on policies that we follow in the MOC environment.

### Creating a new policy

1. Copy the policy template to a new subdirectory of [`policies`](policies). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```sh
    cp -a templates/policy policies/2026-10-15-adr-approval-process
    ```

2. Edit the `README.md` file in the new directory to create your policy.

3. Submit a pull request with your changes.

### Approving a policy

This section summarises the process defined by the
[Policy on Policies](policies/2026-10-30-policy-on-policies/). It is a
convenience for people working through a pull request; where the two differ,
the policy governs. Changing how policies are approved means amending that
policy, not editing this section.

Policies carry the broadest approval requirement of any document in this
repository, because they bind all three participating institutions.

**Who approves.** MOC, Boston University, and Red Hat each designate one
approver for policy pull requests, listed in
[Designated Policy Approvers and Responsible Teams](policies/2026-10-30-policy-on-policies/approvers/).
Anyone may review and comment; only the designated approver records their
institution's approval. The approver may not be the author, in which case that
institution's alternate approves instead.

**What is required to merge.**

- All three institutions must approve. There is no majority, and no
  institution's approval may be waived by the others.
- The pull request stays open for at least ten business days after it has been
  announced to all three institutions. A substantive change to the normative
  text restarts that period; an editorial correction does not.
- A request for changes blocks the merge until the same approver withdraws it.

An editorial correction — a typographical fix, a formatting change, or a
repair to a broken link — may merge with a single approval from any
institution, provided the pull request is labelled `editorial`.

**Once the last institution has approved**, and before the pull request
merges, the proposer makes a final commit that records the approval:

1. For a new policy, complete the `Initial version` row of its **Version
   History** table. For an amendment, add a new row. Either way the row
   records the date the last institution approved, the change type
   (`Normative`, `Editorial`, or `Supporting`), and a short description of
   what changed.
2. Replace the `Pending` placeholder in that row's Pull request column with
   this pull request's number.
3. Confirm the policy still carries the eight required sections in order, and
   that any section with no content reads `None.`

> [!NOTE]
> The `main` ruleset does not dismiss approvals on push, so this final commit
> does not invalidate the approvals already recorded. The ruleset requires two
> approving reviews; the requirement that one come from each institution is
> enforced by the approvers, not by GitHub.

A policy's last-approved date is the date of the most recent `Normative` row
in its Version History. There is no separate frontmatter field to maintain, so
there is no second copy of the date that can drift out of step.

## Production Change Requests

The [`production-changes`](production-changes) directory contains a log of changes made to our production environments. If you need to perform production-impacting maintenance, you create a pull request with information about the required maintenance action. Once your PR is approved you are free to perform the described action, and the document becomes a permanent record of that maintenance.

### Creating a new production change request

1. Copy the production change template to a new subdirectory of [`production-changes`](production-changes). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```sh
    cp -a templates/production-change production-changes/2026-10-15-delete-observability-pvc
    ```

2. Edit the `README.md` file in the new directory to create your change request.

3. Submit a pull request with your changes.

### Approval

TBD.
