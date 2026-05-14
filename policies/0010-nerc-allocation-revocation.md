### Summary

This proposal defines a standardized workflow for handling resource allocations in ColdFront and their transition into **Expired** and **Revoked** statuses. It establishes clear timelines for access termination, data retention grace periods, and administrative overrides, ensuring automated lifecycle management and manual oversight if necessary.

### Motivation

Currently, the transition from an active allocation to total resource deletion requires a manual and granular approach. We need to:

- **Automate lifecycle management** to simplify administration.
- **Provide clear communication** to users regarding data deletion deadlines.
- **Support "Special Case" scenarios** where data must be preserved for legal or security reasons without charging the user or allowing access.

### User Stories

- **As an Admin,** I want the system to automatically revoke access when an allocation reaches its end date (expires).
- **As a PI,** I want to receive multiple notifications before my allocation is expired, access is revoked, and storage is deleted.
- **As an Admin,** I want to "suspend" an allocation (Special Case: No Deletion) so that I can investigate an incident without the risk of automated scripts deleting the evidence.
- **As an Admin,** I want to manually override revocation timings to accommodate valid user appeals or policy exceptions.

### Proposal

#### 1. The Expiration / Revocation Lifecycle

Each allocation has an end date at which point the allocation automatically enters **"Expired"** status. The allocation will no longer transition into the **"Active (Needs Renewal)"** status.

The transition to **Revoked** occurs automatically 30 days after an allocation enters **"Expired"**. It can also be triggered manually by an admin.

| **Phase**                | **Days from End Date** | **System Actions**                                                                | **User Impact**                                                        |
|--------------------------|------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------------------------|
| **Renewal Notification** | -30                    | Notification sent. Renewal button appears in ColdFront with a countdown.          | No impact.                                                             |
| **Expiration Trigger**   | 0                      | Status changed to **Expired**. Notification sent. Compute and networking stopped. | All cluster access disabled. Storage data is preserved but not billed. |
| **Revocation Trigger**   | 30                     | Storage data is deleted.                                                          | Storage data is deleted and no recovery is possible.                   |

For OpenStack, expiration is implemented by shelving all VMs and deleting networking objects, and switching the project status to disabled to prevent further access. Object storage and volumes are preserved. After the storage grace period, the remaining storage resources are deleted.

For OpenShift, expiration is implemented by deleting all Pods, Deployments, Jobs, CronJobs, and other resources that pertain to compute or networking. Persistent Volumes, ConfigMaps, and Secrets are preserved during the storage grace period. After the storage grace period, those resources are deleted too.

#### 2. Implementation Timeline

The implementation of this proposal will be done in 3 phases.

1. Manual Expiration (4 months) - PI and user training and communication of the new workflow. Expiration will not revoke access automatically while we monitor user success in renewing allocations on time.
2. Automatic Expiration, Manual Revocation (4 months) - Expiration will revoke access automatically, however deletion of storage at the end of the grace period will be manual.
3. Automatic Expiration, Automatic Revocation - Both expiration and revocation will happen automatically.

#### 3. Notification Schedule

Users will receive an email notification when these status changes are performed.
Additionally, they will receive periodic reminders before automatic status changes (to **Expired** and **Revoked** states) with the following schedule:

- **Initial:** 30 days
- **Reminder:** 14, 7 days
- **Final Warning:** 2 days

#### 4. Special Case: Administrative Hold (No Deletion)

For legal holds or security incidents, a new behavior is proposed.

- **Status:** Switches to a new "Suspended"
- **Access:** Only Admins retain access to compute/storage; user access is removed.
	- Admins will need to manually decide whether to stop VMs/pods/networking on a case by case basis.
- **Billing:** Billing is disabled.
- **Persistence:** Storage and compute are retained pending admin action or suspension being lifted.

#### 5. Manual Overrides

Admins have the authority to:

- Extend the end dates of projects manually.
- Revoke or reinstate projects ahead of time by switching their status.
  - If the status is switched directly to **Revoked**, then the storage grace period is not implemented.

### Drawbacks

- **Storage Costs:** Maintaining a 30-day grace period for all revoked allocations increases storage overhead.
- **Complexity:** Selectively removing only specific resources from an allocation while preserving data is more complex than deleting the entire OpenStack project or OpenShift namespace.

### Alternatives

- **Keep suspended (administrative hold) projects in the Active state:** Possibility of confusion and harder to distinguish in billing.
- **Continue with Manual Lifecycle Management:** Continuing to rely on admins to manually move states and clean up allocation. Not scalable for high-volume environments.
