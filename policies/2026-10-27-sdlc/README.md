---
title: Secure Software Development Life Cycle (SDLC) Policy
standards: [nist-ac, nist-at, nist-au, nist-cm, nist-ia, nist-ra, nist-ca, nist-sc, nist-si]
---

**Document Owner:** [TBD]
**Approved By:** [TBD]
**Review Cycle:** [TBD]
**Effective Date:** December 1, 2026
**Document Version:** DRAFT
**Parent Document:** System Security Plan (SSP): [SSP link: TBD]
**Target Compliance Framework:** NIST SP 800-171 Rev 2 (Protecting CUI in Nonfederal Systems)

Items marked **[TBD]** are placeholders for content or decisions still to be provided. They are collected in Section 9.

## 1\. Scope & System Overview

### 1.1 Scope & Applicability

This Secure Software Development Life Cycle (SDLC) policy is a supporting document required by, and referenced from, the System Security Plan (SSP). It is not an assessment of all NIST SP 800-171 requirements. It addresses only the requirements that are touched by writing and running code in production within the CUI boundary. How the system implements each requirement (components, settings, tools, and evidence) is documented in the SSP.

MOC operates as a cloud service provider. This policy applies to code, infrastructure-as-code (IaC), configuration, container images, deployment mechanisms, and engineering personnel for the platform that MOC builds and operates. Code that handles CUI on behalf of a tenant is the tenant's responsibility under the shared responsibility model described in the SSP, and is not governed by this policy.

### 1.2 CUI Boundary, Deployment Model & External Systems

* **Platform:** The platform consists of an on-premises OpenShift cluster and foundational services (for example Keycloak and LDAP) on Amazon EKS in AWS. Both are within the CUI boundary. The SSP describes the architecture, the boundary, and the network path between them.
* **Deployment Model:** CI/CD does not deploy to production. Jobs running inside the CUI boundary, pull approved configuration from the public and private GitHub repositories and apply it to production, including the on-premises OpenShift cluster (see Section 6.1).
* **GitHub as an External System:** GitHub (including GitHub Actions) is not an in-scope external system for the purposes of NIST SP 800-171 3.1.20. It holds no authorization to change production and no credentials for production or for anything inside the CUI boundary. [TBD: confirm.] Controls on what reaches the branches that are pulled into production are described in Sections 3 and 6.1.

### 1.3 Relationship to the SSP and Related Policies

* This policy implements the SDLC-related portions of the SSP. Section 8 lists the NIST SP 800-171 requirements it supports. All other requirements are addressed in the SSP.
* The following BU policies govern areas this policy touches. This policy states only the SDLC-facing expectations and does not replace them: the [BU Cyber Incident Response Policy](https://www.bu.edu/policies/cyber-incident-response-policy/), the [BU Vulnerability Management Standard](https://www.bu.edu/policies/vulnerability-management-standard/), the [BU Cyber Risk Management Standard](https://www.bu.edu/policies/cyber-risk-management-standard/), the [BU Identity and Access Management Standards](https://www.bu.edu/policies/identity-and-access-management-standards/), the [BU Log Collection, Analysis, and Retention Standard](https://www.bu.edu/policies/log-collection-analysis-and-retention-standard/), and the [BU Minimum Security Standards](https://www.bu.edu/policies/minimum-security-standards/).
* **CUI classification:** The [BU Data Classification Standard](https://www.bu.edu/policies/data-classification-standard/) classifies CUI as Restricted Use data. Where a contract, grant, or law imposes its own rules, the most restrictive requirements apply.

## 2\. Environment Isolation & Access Control

### 2.1 Environment Isolation (NIST SP 800-171 Rev 2: 3.13.2)

* Development and CI build environments are segregated from production. CI/CD holds no production credentials or authorization.
* Continuous Integration (CI) workflows execute within isolated, short-lived, GitHub-hosted runners.
* Testing and staging take place in dedicated environments, in AWS and on-premises, that are isolated from production and hold no CUI and no production credentials or secrets. The SSP describes how they are isolated.

### 2.2 Test Data Protection (NIST SP 800-171 Rev 2: 3.1.3)

* Real CUI and actual production data are **strictly prohibited** from being used in development, staging, or testing environments.
* Development and testing processes must rely exclusively on synthetic data, mock interfaces, or sanitized sample datasets. This is stricter than the [BU Minimum Security Standards](https://www.bu.edu/policies/minimum-security-standards/), which permit production Restricted Use data in non-production systems only with equivalent controls.

### 2.3 Source Control & Repository Access (NIST SP 800-171 Rev 2: 3.1.1, 3.1.5, 3.5.3)

* **Repositories:** Source code and configuration repositories are hosted under GitHub Enterprise. Configuration is split into public and private repositories. Public repositories store public manifests with templated placeholders for sensitive information such as IP addresses. Private repositories store the sensitive configuration. Public repositories must not contain CUI, credentials, or environment-specific sensitive configuration (for example account identifiers, IP addresses, network topology, or realm and directory configuration). Private repositories must not contain CUI or credentials. [TBD: state who can read the private repositories, and how public repositories are checked for placeholders only (for example CI scanning or a pre-publication review).]
* **Authentication:** Multi-Factor Authentication (MFA) is enforced across the entire GitHub organization for all members.
* **Authorization:** Role-Based Access Control (RBAC) is managed via GitHub Teams, granting least-privilege access to specific project repositories.
* **Actions on Forks:** GitHub Actions workflows never run on forks when they contain secrets. Where workflows do contain secrets, those secrets are never for anything within the CUI boundary.

### 2.4 Separation of Duties & Process Identities (NIST SP 800-171 Rev 2: 3.1.4, 3.1.5, 3.5.2)

* **Separation of duties:** No individual can both author and approve a change (Section 3.3). Key administration is separated from key usage (Section 5.2). Authors of platform changes do not hold the ability to alter audit logs (Section 6.2).
* **Process identities:** The jobs on EKS that pull configuration authenticate to GitHub as a GitHub App. For each run, the job uses the App's private key to obtain an installation access token, which expires after one hour and is limited to read access to the configuration repositories. The private key itself is long-lived: it is stored in AWS Secrets Manager and rotated as in Section 5.1. Every automation identity in the deployment path runs with only the privileges required for its task. The SSP documents each identity and its scope.
* Human and privileged access to the platform follows the [BU Identity and Access Management Standards](https://www.bu.edu/policies/identity-and-access-management-standards/) and is documented in the SSP.

## 3\. Configuration Management & Change Control

### 3.1 Baselines & Source Control (NIST SP 800-171 Rev 2: 3.4.1)

* **Version Control System:** Git is used for all code, scripts, and infrastructure configuration files. Configuration in Git is the baseline for production.
* **Branch Protection Policies:** Direct commits or force pushes to the primary production branch (main) are disabled.
* **Build Verification:** CI test suites must pass successfully prior to merging any pull request (PR).

### 3.2 Security Configuration Settings (NIST SP 800-171 Rev 2: 3.4.2)

* Because all changes flow through GitHub, security configuration settings are defined in code in the repositories, validated in CI by **Checkov** (Terraform in moc-aws), and applied to production only by the pull-based mechanism in Section 6.1. Settings in production are therefore those that were reviewed and merged.
* Each platform component has a documented hardening benchmark, listed in the SSP. Configuration in the repositories implements it.
* Differences between Git and production are detected and corrected. [TBD: how drift is detected and reverted.]

### 3.3 Change Approval Process (NIST SP 800-171 Rev 2: 3.4.3)

* Every PR requires **at least two approvals** from designated MOC organization members.
* The author of the PR is explicitly restricted from approving their own changes.
* These rules apply to both the public and the private configuration repositories.
* Branch protection rules apply to administrators, with no bypass list. Required approvals are dismissed when new commits are pushed.
* A CODEOWNERS file requires review by designated security reviewers for security-sensitive paths (for example authentication, cryptography, network, logging, and boundary configuration).
* All peer reviews, comments, and approvals are permanently logged within the GitHub repository pull request audit record.

### 3.4 Security Impact Analysis (NIST SP 800-171 Rev 2: 3.4.4)

Every PR to a repository that affects the platform must include a completed security impact analysis in the PR description, using the template below. Any "Yes" answer, or an impact rating above None, requires approval from a designated security reviewer (Section 3.3). Automated scan results (Section 4.2) are inputs to the analysis and do not replace it.

```markdown
## Security Impact Analysis

Does this change affect any of the following? (Yes / No, with a note for each Yes)
- [ ] Authentication or authorization (Keycloak, LDAP, IAM, RBAC)
- [ ] Cryptography, key management, or certificates
- [ ] Network paths, security groups, ingress or egress, or the CUI boundary
- [ ] Logging, auditing, or monitoring
- [ ] Data flows involving CUI, or storage of data
- [ ] Privileged functions or privileged accounts
- [ ] New or updated dependencies, base images, operators, or external services
- [ ] Security configuration settings or hardening baselines

**Overall security impact:** None / Low / Moderate / High
**Risks and mitigations:**
**Rollback plan:**
**Security reviewer (required if any Yes):**
```

**Emergency changes:** [TBD: define the expedited path and the required after-the-fact review.]

### 3.5 Change Access Restrictions (NIST SP 800-171 Rev 2: 3.4.5)

* Production changes are made only by merging to the protected branch that the pull-based mechanism in Section 6.1 reads. Only PRs satisfying Section 3.3 can reach it.
* [TBD: who may merge and who may administer the repositories (roles in Section 7.5), and how direct changes to production outside this flow, such as console or `oc` changes, are prevented or detected.]

### 3.6 Least Functionality & Software Execution Control (NIST SP 800-171 Rev 2: 3.4.6, 3.4.7, 3.4.8)

* **Permit-by-exception for images (3.4.8):** EKS and OpenShift refuse to run unsigned or unverified container images (Section 6.1).
* **GitHub Actions:** Third-party actions are pinned to a full commit SHA and restricted to an approved list at the organization level. [TBD: confirm.]
* **Images (3.4.6, 3.4.7):** Container images are built from minimal base images and expose only the ports, services, and protocols they require. [TBD: confirm.]

### 3.7 Software Inventory & Dependency Management (NIST SP 800-171 Rev 2: 3.4.1)

* **Python:** Dependencies are pinned to explicit versions with hashes (`pip install --require-hashes`) in requirements files. [TBD: confirm.]
* **Terraform/OpenTofu:** Provider and module versions are pinned, and dependency lock files (`.terraform.lock.hcl`) are committed.
* **Containers and operators:** Base images are referenced by digest. Operators and Helm charts are pinned to specific versions.
* **GitHub Actions:** Pinned by commit SHA (Section 3.6).
* [TBD: dependency control for Keycloak and LDAP configuration, themes, and extensions.]
* **Software Bill of Materials (SBOM):** SBOMs are automatically generated for software releases following the **SPDX** standard format to track open-source dependencies and third-party components.

## 4\. Secure Coding & Flaw Remediation

### 4.1 Secure Coding Standards (NIST SP 800-171 Rev 2: 3.13.2)

* Python development teams must adhere to the **OpenSSF Secure Coding One Stop Shop for Python** guidelines.
* Key mandatory practices include strict input validation, safe deserialization, parameterization of SQL/ORM queries, context-aware output encoding, and secure memory handling.

### 4.2 Automated Security Scanning (NIST SP 800-171 Rev 2: 3.11.2, 3.14.1)

* **Trivy** and **Checkov** are integrated into the GitHub Actions CI pipeline. Automated scans execute on every PR and build to identify:
  * Software Composition Analysis (SCA) vulnerabilities in dependencies (Trivy).
  * Known vulnerabilities (CVEs) in container base images (Trivy).
  * Misconfigurations in container and IaC configuration (Trivy and Checkov). Checkov checks the Terraform in moc-aws.
  * Secrets committed to repositories (Trivy secret scanning). [TBD: confirm, and consider GitHub secret scanning with push protection.]
* **Static application security testing (SAST):** Trivy does not provide SAST. [TBD: select a SAST tool for Python, for example Bandit, Semgrep, or CodeQL.]
* **Rescans:** Deployed images and dependencies are rescanned on a schedule, not only on PRs and builds, so that newly published vulnerabilities are identified. [TBD: define the frequency (for example daily) and tooling.]
* Vulnerability scanning of the running platform is part of the vulnerability management program described in the SSP.

### 4.3 Vulnerability Remediation (NIST SP 800-171 Rev 2: 3.11.3, 3.14.1)

Vulnerability (CVE) management is governed by the [BU Vulnerability Management Standard](https://www.bu.edu/policies/vulnerability-management-standard/) and the [BU Cyber Risk Management Standard](https://www.bu.edu/policies/cyber-risk-management-standard/), which take precedence over this section. Flaws discovered through automated scanning, external assessments, or security reporting are remediated within the deadlines below. Deadlines run from the date the vulnerability is identified or the Risk Owner is notified. They combine two BU requirements: the Risk Management Standard sets deadlines by severity, and the Vulnerability Management Standard requires every vulnerability, regardless of severity, to be remediated within 60 days of becoming known. The stricter applies.

| Severity | CVSS v3 Score | Systems containing University Data (all production and CUI systems) | Systems without University Data (for example pre-production) |
| :---- | :---- | :---- | :---- |
| **Critical** | 9.0 – 10.0 | **5 days** | **14 days** |
| **High** | 7.0 – 8.9 | **14 days** | **28 days** |
| **Medium** (BU: Moderate) | 4.0 – 6.9 | **28 days** | **60 days** \* |
| **Low** | 0.1 – 3.9 | **60 days** \* | **60 days** \* |

\* The Risk Management Standard allows 90 days (Low, systems with University Data) and 90 and 180 days (Medium and Low, systems without University Data). The 60-day limit of the Vulnerability Management Standard applies instead. [TBD: confirm that BU's Moderate corresponds to CVSS Medium, and whether known-exploited (KEV) vulnerabilities get a shorter target.]

* A vulnerability that cannot be remediated within its deadline is handled as an exception or risk acceptance under the BU standards above, and is tracked as described in Section 7.3.

### 4.4 Security Alerts & Advisories (NIST SP 800-171 Rev 2: 3.14.3)

* Service owners subscribe to vendor mailing lists and other sources to track vulnerabilities in the components they maintain, as the BU Vulnerability Management Standard requires. The SSP lists the sources and who acts on them.

## 5\. Secrets Management & Cryptography

### 5.1 Secrets Handling (NIST SP 800-171 Rev 2: 3.5.10)

* Storing credentials, API keys, certificates, or tokens directly in source code or Git repositories is **strictly forbidden**.
* Application credentials and operational secrets, including those used by automation and by the on-premises cluster, are stored in **AWS Secrets Manager** and rotated at least every **90 days**, consistent with the [BU Minimum Security Standards](https://www.bu.edu/policies/minimum-security-standards/) requirement to rotate access keys and tokens at least every 90 days.

### 5.2 Key Management (NIST SP 800-171 Rev 2: 3.13.10, 3.1.4)

* **Key rotation:** Customer-managed cryptographic keys (AWS KMS) are rotated automatically at least every **90 days**.
* **Separation of duties:** Individuals who administer keys (create, change policy, schedule deletion) are not the same individuals who use keys to encrypt or decrypt data, and no single individual can both change a key policy and use the key. Key policies are managed in code and changed only through the process in Section 3.3.
* **Certificates:** TLS/SSL certificates are provisioned and managed via **AWS Certificate Manager (ACM)** or automated via **Let's Encrypt**, with automated renewal.
* Key compromise, revocation, and deletion procedures are documented in the SSP.

### 5.3 Cryptographic Protection (NIST SP 800-171 Rev 2: 3.13.8, 3.13.11, 3.13.16)

* Cryptography that protects the confidentiality of CUI, at rest and in transit, must use **FIPS 140-2 or FIPS 140-3 validated cryptographic modules**. Encryption in transit requires TLS 1.2 or TLS 1.3.
* Under the [BU Minimum Security Standards](https://www.bu.edu/policies/minimum-security-standards/), Restricted Use data, and its backups, must be encrypted at rest and in transit.
* The SSP records how each component meets this, including FIPS mode settings and the validated module certificate numbers.

## 6\. Pipeline Integrity & Audit Logging

### 6.1 CI/CD Supply Chain & Deployment (NIST SP 800-171 Rev 2: 3.4.3, 3.4.8, 3.13.2)

* Container images are built automatically via GitHub Actions upon publishing a formal GitHub release tag.
* Container images are cryptographically signed using **Sigstore** to guarantee supply chain integrity and provenance.
* **EKS and OpenShift refuse to run unsigned or unverified images.** [TBD: the trusted signing identity, and how it is rotated or revoked if compromised.] The SSP documents the enforcement mechanism on each platform.
* **Pull-based deployment:** CI/CD does not deploy to production. Jobs running inside the CUI boundary pull the approved configuration from the protected branches of the public and private repositories and apply it to production, including the on-premises OpenShift cluster. [TBD: confirm how Terraform/OpenTofu changes are applied, and whether the jobs verify commit or tag signatures.]

### 6.2 Audit Trail (NIST SP 800-171 Rev 2: 3.3.1, 3.3.2)

* Changes to the platform are traceable to authenticated individuals through GitHub commit history, pull request reviews and approvals, release tags, and AWS CloudTrail.
* **GitHub audit log:** Because GitHub's own retention is limited, the GitHub organization audit log is streamed to retained storage. [TBD: destination.]
* Platform logs are collected, protected, and retained under the [BU Log Collection, Analysis, and Retention Standard](https://www.bu.edu/policies/log-collection-analysis-and-retention-standard/), as documented in the SSP. Authors of platform changes cannot alter or delete audit logs.

## 7\. Governance, Training & Continuous Monitoring

### 7.1 Security Training (NIST SP 800-171 Rev 2: 3.2.2)

* Developers receive mandatory, role-specific secure coding training **at least annually**.
* Training curricula cover:
  * OpenSSF Python secure development practices.
  * OWASP Top 10 web/API vulnerabilities.
  * Supply chain risks, software dependency hygiene, and secrets mitigation.

### 7.2 Security Assessments

* Software and its deployment pipeline are within the scope of the security assessments and penetration tests described in the SSP. Findings are remediated under Section 4.3.

### 7.3 Deficiency Tracking & POA\&M (NIST SP 800-171 Rev 2: 3.12.2)

* Flaws, deferred vulnerabilities, or architectural deficiencies that cannot be resolved within the standard remediation timeframe are tracked **privately**, never in public GitHub Issues or in CCI-MOC/moc-issues.
* Each item is recorded in the organizational **Plan of Action and Milestones (POA\&M)**, detailing root cause, mitigation steps, interim risk controls, owner, and target completion date. The SSP identifies the tracker and its relationship to BU's Cyber Risk Register.

### 7.4 Incident Response

* SDLC-related security events (for example a compromised pipeline or runner, a leaked secret, a malicious dependency, or a compromised signing identity) are incidents. They are reported to the IS&T Service Desk (617-353-HELP (4357), ithelp@bu.edu, available 24 hours a day) and handled under the [BU Cyber Incident Response Policy](https://www.bu.edu/policies/cyber-incident-response-policy/), as documented in the SSP.

### 7.5 Roles & Responsibilities

[TBD: define the document owner, repository and organization administrators, release approvers, and security reviewers, with their duties. The SSP names who fills each role.]

## 8\. NIST SP 800-171 Rev 2 Control Mapping

This matrix lists the requirements that this SDLC policy supports. It is not a complete assessment; the SSP covers all other requirements, and documents the implementation of those listed here.

| NIST 800-171 Control | Control Requirement Summary | SDLC Implementation / Verification | Status |
| :---- | :---- | :---- | :---- |
| **3.1.1** | Limit system access to authorized users | GitHub Enterprise organization access managed via RBAC (GitHub Teams) and mandatory MFA. |  |
| **3.1.3** | Control the flow of CUI | CUI prohibited in development, staging, and test; synthetic data only. |  |
| **3.1.4** | Separate the duties of individuals | Author and approver separated; key administration separated from key usage; change authors cannot alter audit logs. |  |
| **3.1.5** | Least privilege | GitHub Teams least privilege; least-privilege automation identities in the deployment path. |  |
| **3.2.2** | Ensure personnel are trained in security duties | Mandatory annual role-based secure coding training (OpenSSF) for software engineering staff. |  |
| **3.3.1** | Create and retain system audit logs | GitHub audit log streamed to retained storage; platform logs per the SSP. | TBD (GitHub audit log destination) |
| **3.3.2** | Ensure actions of individual users can be uniquely traced | GitHub commit logs, PR approvals, release tags, and AWS CloudTrail tie changes back to authenticated identities. |  |
| **3.4.1** | Establish baseline configurations and inventories | Configuration in Git is the baseline; pinned dependencies and SPDX SBOMs form the software component inventory. |  |
| **3.4.2** | Establish and enforce security configuration settings | Settings defined as code, validated by Checkov, applied only via the pull-based mechanism; benchmarks listed in the SSP. | TBD (drift) |
| **3.4.3** | Track, review, approve/disapprove, and log changes | Main branch protected; 2 non-author reviews; rules apply to administrators; approvals logged in the PR record. |  |
| **3.4.4** | Analyze security impact of changes prior to implementation | Security impact analysis template required in every PR (Section 3.4). | TBD (emergency changes) |
| **3.4.5** | Define, document, approve, and enforce access restrictions associated with changes | Section 3.5. | TBD |
| **3.4.6, 3.4.7** | Least functionality; restrict nonessential functions | Minimal images exposing only required ports and services (Section 3.6). | TBD |
| **3.4.8** | Deny-by-exception or permit-by-exception software policy | EKS and OpenShift refuse unsigned or unverified images; pinned, allow-listed Actions. | TBD (signing identity) |
| **3.5.2** | Authenticate users, processes, or devices | Read-only, least-privilege automation identities (Section 2.4). |  |
| **3.5.3** | Use multifactor authentication (MFA) | Organization-wide mandatory MFA enforced on GitHub Enterprise. |  |
| **3.5.10** | Store and transmit only cryptographically protected passwords | Credentials and operational secrets stored in AWS Secrets Manager, rotated every 90 days; secrets prohibited in source code. |  |
| **3.11.2** | Scan for vulnerabilities periodically and when new ones are identified | Trivy and Checkov scans on every PR and build; scheduled rescans of deployed images. | TBD (rescan frequency) |
| **3.11.3** | Remediate vulnerabilities per risk assessments | BU Vulnerability Management Standard (60 days maximum) and Cyber Risk Management Standard (deadlines by severity), applied in Section 4.3. |  |
| **3.12.2** | Develop and update Plan of Action (POA\&M) | Unresolved deficiencies tracked privately in the POA\&M (Section 7.3). |  |
| **3.12.4** | System Security Plan | This policy is referenced by the SSP. |  |
| **3.13.2** | Employ architectural designs, development techniques, and engineering principles that promote security | OpenSSF secure coding standards; dev/CI and staging isolated from production; Sigstore-signed images verified at deploy. |  |
| **3.13.8** | Cryptographic mechanisms to prevent unauthorized disclosure of CUI in transmission | TLS 1.2/1.3 using FIPS-validated cryptographic modules required (Section 5.3). |  |
| **3.13.10** | Establish and manage cryptographic keys | AWS KMS customer-managed keys rotated every 90 days; key administration separated from key usage; ACM and Let's Encrypt certificates with automated renewal. |  |
| **3.13.11** | Use FIPS-validated cryptography | FIPS 140-2/3 validated modules required for CUI at rest and in transit (Section 5.3). |  |
| **3.13.16** | Protect the confidentiality of CUI at rest | Encryption at rest required (Section 5.3). |  |
| **3.14.1** | Identify, report, and correct flaws | OpenSSF coding practices; Trivy and Checkov scanning; remediation timeframes (Critical \= 5d, High \= 14d). | TBD (SAST tool) |
| **3.14.3** | Monitor security alerts and advisories | Section 4.4. |  |

## 9\. Open Items

1. SSP link; document owner, approver, review cycle, and roles (Header, 7.5).
2. Confirm GitHub is out of scope for 3.1.20 (1.2).
3. Who can read the private repositories; how public repositories are checked for placeholders only (2.3).
4. Drift detection (3.2); emergency change process (3.4); change access restrictions (3.5).
5. Confirm Actions pinning and allow-list, and minimal images (3.6); confirm Python hashes; Keycloak and LDAP dependency controls (3.7).
6. SAST tool selection; secret scanning confirmation; rescan frequency (4.2).
7. Confirm the mapping of BU Moderate to CVSS Medium, and KEV handling (4.3).
8. Trusted signing identity and its revocation; how Terraform/OpenTofu is applied; whether the jobs verify commit or tag signatures (6.1).
9. GitHub audit log destination (6.2).

## 10\. References

* [BU Data Classification Standard](https://www.bu.edu/policies/data-classification-standard/)
* [BU Minimum Security Standards](https://www.bu.edu/policies/minimum-security-standards/)
* [BU Identity and Access Management Standards](https://www.bu.edu/policies/identity-and-access-management-standards/)
* [BU Log Collection, Analysis, and Retention Standard](https://www.bu.edu/policies/log-collection-analysis-and-retention-standard/)
* [BU Cyber Risk Management Standard](https://www.bu.edu/policies/cyber-risk-management-standard/)
* [BU Vulnerability Management Standard](https://www.bu.edu/policies/vulnerability-management-standard/)
* [BU Cyber Incident Response Policy](https://www.bu.edu/policies/cyber-incident-response-policy/)
* [NIST SP 800-171 Rev 2](https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final)
