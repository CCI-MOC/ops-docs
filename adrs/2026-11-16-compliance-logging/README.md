---
title: Logging Requirements and Tool Choices
standards: [nist-si, nist-ra, nist-au]
---

## Context

Logging is an overloaded term that this ADR attempts to clarify, and it separates logging into three separate requirements, three specific requirements within compliance, and two separate environments.

For each combination of requirement and environment, this ADR either captures tool choices where a tool is already deployed or proposes a single solution where no deployment exists.

### Logging Requirements

There are three things we are talking about when talk about logging:

1. Logging for operational needs. Is the cluster up; has the hardware failed?
2. Logging for billing: Who is using what resource, and how much does it cost them?
3. Logging for compliance: Does an audit log exist? Is the environment compliant, and is behavior in that environment compliant, too?

#### Compliance Logging

##### NIST Controls

From 800-171/800-53 Audit and Accountability (AU) comes a general need to retain logs in a central location (3.3.1) with identifying information for log events (3.3.2).

From 171/53 Risk Assessment (RA) comes the need to do vulnerability scanning (3.11.2) and remediation (3.11.3).

From 171/53 System and Information Integrity (SI) comes the need to protect against malware (3.14.2, 3.14.4, 3.14.5) and to monitor for security incidents (3.14.6, 3.14.7).

SI 3.14.1 concerning "security flaws" and 3.14.3 concerning "security alerts and advisories" are a part of vulnerability scanning (3.11.2) and remediation (3.11.3) for the sake of this discussion.

AU 3.3.5 concerning correlation of activity and 3.3.6 concerning reporting and reduction are part of centralized logging for the sake of this discussion.

##### Compliance Logging Requirements

Given the [NIST Controls](#nist-controls), compliance logging consists of three distinct use cases:

- Incident Detection: Does suspicious behavior from someone or something come to our attention?
- Vulnerability and Compliance Scanning: Does the configuration of our environment continue to be correct?
- Archive: Does a record of all compliance-related events persist?

In this classification, here are some terms that fall under each of these three use cases:

- Incident Detection:
  - Security Information and Event Management (SIEM)
  - Endpoint Detection and Response (EDR)
  - Host-Based Intrusion Detection System (HIDS)
  - Malware scanners
  - Antivirus software
  - Red Hat Advanced Cluster Security (threat detection and response)
  - Wazuh
  - AWS GuardDuty
  - AWS OpenSearch Security Analytics
- Vulnerability and Compliance Scanning:
  - OpenShift Compliance Operator
  - Red Hat Advanced Cluster Security (image and node scanning)
  - AWS Inspector
  - AWS Security Hub Cloud Security Posture Management (CSPM)
- Archive:
  - LokiStack
  - Pure FlashBlade Object Store
  - AWS CloudWatch
  - AWS CloudTrail
  - AWS Config
  - AWS VPC Flow Logs
  - AWS Route53 query logs
  - AWS EKS logs
  - AWS WAF logs
  - AWS Elastic Load Balancing logs
  - AWS S3
  - AWS S3 Object Lock
  - AWS Security Hub (correlation)

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

## See also

[Continuous monitoring under FedRAMP 20x: Replacing annual assessments with persistent validation](https://aws.amazon.com/blogs/publicsector/continuous-monitoring-under-fedramp-20x-replacing-annual-assessments-with-persistent-validation/)
[CloudWatch: Exporting log data to Amazon S3](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3Export.html)
[CloudWatch: Real-time processing of log data with subscriptions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html)
[SOC Prime](https://socprime.com/)
[Sigma Backends](https://sigmahq.io/docs/digging-deeper/backends)
[Loki backend for pySigma](https://github.com/grafana/pySigma-backend-loki)
