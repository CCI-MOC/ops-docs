---
title: Logging Requirements and Interfaces
standards: [nist-si, nist-ra, nist-au]
---

## Context

Logging is an overloaded term that this ADR attempts to clarify, and it separates logging into three separate requirements, three specific requirements within compliance, and two separate environments.

Given the broad scope and existing work, this ADR focuses on the specific points MOC needs to agree on to progress.

### Logging Requirements

There are three things we are talking about when talk about logging:

1. Logging for operational needs. Is the cluster up; has the hardware failed?
2. Logging for billing: Who is using what resource when, and how much does it cost them?
3. Logging for compliance: Does an audit log exist? Is the environment compliant, and is behavior in that environment compliant, too?

#### Compliance Logging

##### Compliance Logging Requirements

Compliance logging consists of three distinct use cases:

- Incident Detection: Does non-compliant behavior from someone or something come to our attention?
- Vulnerability and Compliance Scanning: Does the configuration of our environment continue to be compliant?
- Archive: Does a record of all compliance-related events persist?

In this classification, here are some terms that fall under each of these three use cases:

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
[AWS Security Incident Response Guide (2019)](https://d1.awsstatic.com/WWPS/pdf/aws_security_incident_response.pdf)
[AWS Security Incident Response Guide (2020)](https://d1.awsstatic.com/whitepapers/aws_security_incident_response.pdf)
