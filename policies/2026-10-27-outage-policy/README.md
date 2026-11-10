---
title: Outage Reporting
---

## Context

The MOC periodically schedules outages for data center maintenance or software upgrades that affect users’ access to cluster resources.

Advance notice allows maintenance to proceed while minimizing disruption and helps users plan their usage around outages.

## Policy

### Defining Users

The MOC must maintain a mailing list for outage notifications. New users must be added during onboarding using the email addresses collected as part of that process.

The mailing list must keep subscribers’ email addresses private. Notifications must be sent using Bcc, and the list must be configured so recipients cannot view its membership.

### Outage Coordinator

The team should decide on a designated person to send out the outage notice. This person should be alerted when an outage happens, and they should send out the communications for that outage.

### Mainentance Windows

MOC maintainers may schedule maintenance at any time, provided they follow the notification schedule below. A recurring maintenance window is not required, and there does not have to be standard maintenance windows.

### Contents of Communications

Users must be notified by email two weeks, one week, and one day before a scheduled outage. Each notification must include:

1. **Timing and duration**: The scheduled start and end times, including the time zone, and the estimated duration of the outage.
2. **Required user actions**: Any steps users must take before the outage to preserve their data or workload state, such as backing up data or saving checkpoints.
3. **Affected components**: The services and resources that will be unavailable, along with any that will remain available. For example, if maintenance affects only GPU networking, users may still be able to run CPU workloads in OpenShift AI.
4. **Point of contact**: Contact information for questions about the outage.
5. **Relevant issue**: For any outage, there should be a relevant issue created in the CCI-MOC/MOC-issues repository, and the issue should be linked to in the email.

The mailing list should be private as to not expose people's emails, so the users should be bcc'd. An example would look like:

```
Subject: Scheduled MOC Outage — October 27, 2026
Bcc: [MOC user mailing list]

Hi all,

The MOC cluster will be unavailable on October 27, 2026, from
9:00 a.m. to 5:00 p.m. Eastern Time (an estimated eight hours)
while we update switches in the data center.

All cluster services, including running workloads and OpenShift AI,
will be unavailable during this period. Before maintenance begins,
please save workload checkpoints and back up any critical data.

We will send reminders one week and one day before the outage.

You can track maintenance progress here:
https://github.com/CCI-MOC/MOC-issues/issues/597

For questions, please contact [name] at [email address].

Best,
[Sender]
```

###
