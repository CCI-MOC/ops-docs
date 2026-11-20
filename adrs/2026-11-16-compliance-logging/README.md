---
title: Logging Requirements and Interfaces
standards: [nist-si, nist-ra, nist-au]
---

## Context

Logging is an overloaded term that this ADR attempts to clarify, and it separates logging into three separate requirements, three specific requirements within compliance, and three separate environments.

Given the broad scope and existing work, this ADR focuses on the specific points MOC needs to agree on to progress.

### Logging Requirements

There are three things we are talking about when talk about logging:

1. Logging for operational needs. Is the cluster up; has the hardware failed?
2. Logging for billing: Who is using what resource when, and how much does it cost them?
3. Logging for compliance: Does an audit log exist? Is the environment compliant, and is behavior in that environment compliant, too?

### Compliance Logging Requirements

Compliance logging consists of three distinct requirements:

- Incident Detection: Does non-compliant behavior from someone or something come to our attention?
- Vulnerability and Compliance Scanning: Does the configuration of our environment continue to be compliant?
- Archive: Does a record of all compliance-related events persist?

#### Compliance Logging Tool Classification

Based on these requirements, here are some terms that fall under each of these three use cases:

- Incident Detection:
  - Security Information and Event Management (SIEM)
  - Endpoint Detection and Response (EDR)
  - Host-Based Intrusion Detection System (HIDS)
  - Malware scanners
  - Antivirus software
  - Red Hat Advanced Cluster Security (threat detection and response)
  - Sigma
  - Wazuh
  - AWS GuardDuty
  - AWS OpenSearch Security Analytics
- Vulnerability and Compliance Scanning:
  - OpenShift Compliance Operator
  - Red Hat Advanced Cluster Security (image and node scanning)
  - AWS Inspector
  - AWS Security Hub Cloud Security Posture Management (CSPM)
  - AWS Config
- Archive:
  - LokiStack
  - Pure FlashBlade Object Store
  - AWS CloudWatch
  - AWS CloudTrail
  - AWS VPC Flow Logs
  - AWS Route53 query logs
  - AWS EKS logs
  - AWS WAF logs
  - AWS Elastic Load Balancing logs
  - AWS S3
  - AWS S3 Object Lock
  - AWS Security Hub (correlation)

### Logging Scope

MOC runs on a combination of AWS, Github, and on-prem.

For AWS, it's:

- EKS
  - Keycloak
    - SES
    - Crunchy Postgres
  - Red Hat Directory Server
  - ArgoCD
  - Netbox (proposed)
- Elastic Load Balancer
- Secrets Manager
- Route 53
- VPC
- Site-to-Site VPN
- S3
- KMS

Github is a collection of repos in CCI-MOC with extensive use of Issues and Actions.

On-premise is:

- OpenShift
  - HCP
  - ACM
  - ArgoCD
  - RHACS
  - Compliance Operator
  - Cluster Logging Operator
  - Other operators
- EverPure FlashBlade storage appliances
- Various network switches with hardware console
- Various compute hardware consoles

### Existing Logging Infrastructure

MOC 1.0 uses Loki, Prometheus, and Grafana extensively, and the current direction is to spin up one centralized observability cluster for both the non-compliant and the compliant environment containing these components.

This ADR does not go over the implementation details except to assert that a Loki endpoint will be available to ingest logs into the observability cluster.

### Compliance Logging Landscape

This ADR assumes that we do not make a proprietary SIEM purchase, that we will not write every vulnerability and incident detection rule by hand, and that we restrict ourselves to free and open source and/or AWS-native tools.

If so, then there are three main players in the space for vulnerability and incident logging rules in the compliance space, excluding AWS-specific solutions:

- [AWS OpenSearch Security Analytics](https://github.com/opensearch-project/security-analytics/tree/main/src/main/config/rules)
- [Wazuh](https://github.com/wazuh/wazuh/tree/main/ruleset/sca)
- [Sigma](https://github.com/SigmaHQ/sigma)

OpenSearch Security Analytics and Wazuh both use OpenSearch as the storage backend for ingested logs. This conflicts with this environment's existing Loki deployment. Were we to adopt either solution, we would duplicate infrastructure spend for log storage and operational effort to normalize data across log streams.

While OpenSearch Security Analytics vendors rules from Sigma, Wazuh maintains its own rule set. For Wazuh 4, this rule set is in XML, but Wazuh 5 is deprecating these XML rules without a migration path and opting for a new Sigma-like rule format. This is another knock against Wazuh.

Third-party rules exist across these solutions. Several repos include Wazuh rules, e.g. [Wazuh-Rules](https://github.com/socfortress/Wazuh-Rules), and a proprietary marketplace and one of the main champions of Sigma rules is [SOC Prime](https://help.socprime.com/en/articles/8106414-how-to-explore-prime-core-content). Sigma has significant adoption, as evinced in the [repo's README](https://github.com/SigmaHQ/sigma#projects-or-products-that-use-or-integrate-sigma-rules).

The actual format of Sigma rules, whether upstream, Security Analytics, or Wazuh's incompatible dialect, is YAML. Here are an [introduction](https://sigmahq.io/docs/guide/about.html#the-format) and the [specification](https://sigmahq.io/sigma-specification/specification/sigma-rules-specification.html) of the format.

Sigma rules abstract over logging and detection implementation, and the [pySigma Loki backend](https://github.com/grafana/pySigma-backend-loki/) provides upstream support for compiling Sigma rules to Loki LogQL.

For AWS-specific solutions, [AWS GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html) is the solution of most interest. GuardDuty [takes logs](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_data-sources.html) from CloudTrail, VPC Flow Logs, and Route53 resolver query logs and delivers [findings](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-active.html) that can be [exported to S3](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_exportfindings.html) and [alerted on with EventBridge](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_eventbridge.html).

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

## See also

### External Links

- [Continuous monitoring under FedRAMP 20x: Replacing annual assessments with persistent validation](https://aws.amazon.com/blogs/publicsector/continuous-monitoring-under-fedramp-20x-replacing-annual-assessments-with-persistent-validation/)
- [CloudWatch: Exporting log data to Amazon S3](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3Export.html)
- [CloudWatch: Real-time processing of log data with subscriptions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html)
- [SOC Prime](https://socprime.com/)
- [Sigma Backends](https://sigmahq.io/docs/digging-deeper/backends)
- [Loki backend for pySigma](https://github.com/grafana/pySigma-backend-loki)
- [AWS Security Incident Response Guide (2019)](https://d1.awsstatic.com/WWPS/pdf/aws_security_incident_response.pdf)
- [AWS Security Incident Response Guide (2020)](https://d1.awsstatic.com/whitepapers/aws_security_incident_response.pdf)

### Issues

- [Implement centralized logging](https://github.com/CCI-MOC/MOC-issues/issues/605)
- [Evaluate centralized observability cluster for alerts across all clusters](https://github.com/CCI-MOC/MOC-issues/issues/703)
- [Collect system logs from all clusters and standalone systems](https://github.com/CCI-MOC/MOC-issues/issues/694)
- [Implement alerting](https://github.com/CCI-MOC/MOC-issues/issues/698)
- [Observability dashboard architecture vision (centralized today → per-cluster / per-project options)](https://github.com/CCI-MOC/MOC-issues/issues/383)
- [Metrics persistence on compliant clusters](https://github.com/CCI-MOC/MOC-issues/issues/784)
