---
title: ADR and RFC policy
---

## Context

The [operations documentation repository ADR](../../adrs/2026-10-15-ops-docs-repository/README.md) defines the "what" for ADRs. This policy defines the "how" for ADRs.

In the past, RFCs combined several functions--specification, requirements, onboarding, memorialization, and consensus-seeking. Coupling these functions meant that consensus-seeking blocked the other four functions, causing implementation delays.

ADRs decouple memorialization, specification, and requirements from onboarding via [`docs`](../../docs/) and from consensus-seeking, which continues on in RFCs.

However, there is the risk that ADRs will conflict with RFCs, whether those RFCs are already present or would be needed.

## Policy

For ADRs, a representative from each of Mass Open Cloud (MOC), Boston University (BU), and Red Hat (RH) must approve any pull request to this repository that includes any changes to an ADR in the `adrs/` folder.

If any representative disagrees with the content or process of the ADR, they must express that disagreement in the pull request conversation and withold approval of the pull request.

Should disagreement persist, any approver may propose a simple majority vote to progress the ADR to a Discovered RFC. If the vote succeeds, the PR closes, and the proposer drafts the Discovered RFC. If the vote fails, a 3 business day countdown begins. Discussion continues, and approvers may continue to propose a Discovered RFC or to seek approval of an adjusted ADR. At the end of the countdown, the PR closes without a Discovered RFC, and the ADR is not adopted.

Discovered RFCs have equal authority as existing Direct RFCs that came without an associated ADR. Where Discovered RFCs and Direct RFCs conflict, the most recent of the Discovered and Direct RFCs must include in its Decision section a determination on where the most recent RFC does and does not supersede past RFCs.
