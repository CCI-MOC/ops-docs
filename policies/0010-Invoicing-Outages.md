# Invoicing Outages

It is critical that we accurately track system outages and scheduled maintenance windows. Implementing a standardized tracking mechanism allows us to automatically deduct these periods from our invoicing processes, ensuring that users are never billed for time when the system is unavailable or unusable.

## Problem Description

Historically, our system has experienced both planned maintenance and unexpected outages that were not systematically recorded in a centralized, easily accessible format. Without a standardized tracking method, there is a significant risk of erroneously billing clients for periods of system downtime, which can lead to customer dissatisfaction.

## Policy

All system outages and scheduled maintenance events must be formally documented. We will utilize the [Outages.yaml](https://github.com/CCI-MOC/nerc-rates/blob/main/outages.yaml) file to centrally track both types of events. Formatting and structure examples for recording these incidents can be found directly within the YAML file.

## Alternatives & History

In the past, outage tracking and billing adjustments were hardcoded directly into the system's codebase. This approach was highly inefficient, as it required code modifications and deployments just to update billing periods, and it prevented non-developers from easily logging outage records. Transitioning to a centralized YAML file separates configuration data from the application logic, streamlining the updating process and reducing the potential for human error.

## Implementation

### Author(s)

Primary author:
  - <joachimw@bu.edu>

Other contributors:
  - None

### Milestones

This policy went into effect Oct 14, 2025.

### Work Items

To maintain accurate billing, the outages.yaml file in the CCI-MOC/nerc-rates repository must be updated monthly. This update must be completed and merged before the end of each month to ensure all downtime is captured prior to the generation of the upcoming invoices.

## References

none

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
