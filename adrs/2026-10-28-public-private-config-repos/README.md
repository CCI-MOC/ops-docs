---
title: Split platform configuration into public and private repositories
standards:
  - nist-ac
  - nist-cm
---

## Context

The platform is configured from code on GitHub: manifests and infrastructure-as-code for the on-premises OpenShift cluster at the MGHPCC and for the foundational services (Keycloak, LDAP) on AWS EKS. We want that configuration to be open and reviewable, in keeping with an open cloud.

Some of the values it needs are sensitive, such as IP addresses and network topology. They are not CUI, but publishing them helps an attacker, and NIST SP 800-171 3.1.22 requires control over information posted on publicly accessible systems.

## Decision

We will split configuration into two kinds of repositories.

| | Public repositories | Private repositories |
|---|---|---|
| **Holds** | Manifests, Helm charts and Kustomize bases, and infrastructure-as-code modules, with templated placeholders in place of sensitive values. Source code, CI workflows, and documentation. | The values that fill the placeholders: IP addresses, network topology, hostnames, account identifiers. Realm and directory configuration. |
| **Never holds** | CUI, credentials, or real sensitive values. | CUI or credentials. |
| **Visible to** | Anyone. | A named team. |

Credentials belong in neither type. They live in AWS Secrets Manager and reach the cluster through the External Secrets Operator.

Both kinds of repository follow the same change control: branch protection with no bypass, two approvals from someone other than the author.

## Consequences

### Benefits

- Configuration stays open and reviewable without publishing sensitive values.
- A single review process covers both kinds of repository.
- The SDLC policy can state clearly what may be public and what may not.

### Changes

- A change that touches a placeholder and its value needs coordinated pull requests in two repositories, and the two can drift apart.
- The EKS jobs need a read-only credential for the private repositories, which must be rotated at least every 90 days.
- The private repositories hold sensitive configuration, so access to them must be limited and reviewed.
- A real value committed to a public repository stays in its history. It must be treated as exposed and replaced.

## See also

- [NIST SP 800-171 Rev 2: 3.1.22, 3.4.3, 3.4.5](https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final)
- [BU Data Classification Standard](https://www.bu.edu/policies/data-classification-standard/)
