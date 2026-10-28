---
title: ADR PRs
standards: [nist-cm]
---

## Context

We want the option to document decisions in a faster, simpler way than RFCs.

Architectural Design Records (ADRs) are this option.

ADRs become active once they arrive in the `main` branch of this repository. To reach `main`, ADRs must go through a pull request (PR), and this policy defines the specifics of these PRs.

## Policy

Mass Open Cloud (MOC), Boston University (BU), and Red Hat (RH) each must approve the PR through a representative from each institution. The representative approving the PR is a separate person from the author of the PR. There is only one approver per institution and any number of reviewers from each institution.

At any point before the PR merges, any approver may propose to progress the ADR to an RFC by commenting in the PR. The PR closes once this request happens, and the proposer drafts the RFC. Once the RFC is approved, the proposer creates an ADR PR for to reflect the consensus reached in the RFC.
