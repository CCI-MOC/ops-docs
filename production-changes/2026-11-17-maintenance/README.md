---
title: Maintenance work on 11/17/2026
owner: hakasapl
target: All OAC and H100 nodes
when: 2026-11-17T11:00:00-05:00
---

## Why

This maintenance was scheduled to allow for Cumulus OS switches to update.
The update will allow us to make use of FIPS mode.

## Impact

None expected. All existing drivers were checked against the new version for
schema changes and no issues were found. The configuration on the switch
should be able to be preserved across the update. If something there goes wrong,
ansible-switches can easily re-make the configuration within the maintenance
window.

## Steps

1. Put the cumulus image 5.16 on a USB drive and plug into the switch
1. Follow the instructions outlined in [cumulus documentation](https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-516/Installation-Management/Upgrading-Cumulus-Linux/) for in-place upgrades.
1. Enable FIPS mode on all Cumulus switches per [cumulus documetation](https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-516/System-Configuration/Authentication-Authorization-and-Accounting/FIPS/)

## Verification

1. Check OS version was updated using `nv show system`
1. Validate that diff between configuration on old config and new config is identical, except for any new fields intoroduced in Cumulus 5.16.

## Rollback

Restore the Cumulus 5.11 image. This will wipe the config but ansible-switches will re-create it.
