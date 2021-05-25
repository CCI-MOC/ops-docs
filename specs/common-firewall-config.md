# Common firewall configuration

We should establish a common firewall configuration and a mechanism
for deploying it automatically to MOC hosts.

## Problem Description

Host firewall configurations in the MOC are varied and unnecessarily
complex. Rather than acting as a security feature, they often result
in unexpected connectivity problems. The firewall rules are often
unique to each individual host, and we have no mechanism for deploying
a change across the MOC environment.

## Policy

We will create an Ansible project for managing the firewall
configuration on MOC hosts. The project must meet the following goals:

- We must be able to configure both environment-wide settings and
  group- and host-specific overrides.

- We must be able to apply the configuration across multiple hosts
  with a single operation.

- The firewall configuration must be consistent: i.e, two hosts
  running the same service should have identical firewall rules for
  that service.

- The configuration should be service based, rather than port based.
  That is, we should be able to say "this host is a web server", and
  have that result in multiple ports (e.g., 80, 443) being allowed in
  the host firewall configuration.

- We should differentiate between hosts that must allow public ssh
  access (e.g. hosts like `kumo-hil-client`) and hosts that only
  require ssh access for administrative users. In the former case, we
  may want to implement some sort of ssh connection rate limiting; in
  the latter case, we may simply want to restrict ssh access to a
  known set of MOC hosts.

## Alternatives & History

On some MOC hosts (but not all), the firewall is generated from a
complex collection of shell scripts located in the `/etc/scripts`
directory. These scripts were installed at system install time, so may
vary from host to host depending on the time at which the host was
initially installed.

The generated configuration involves a  large list of whitelisted
hosts for which no additional information is available.

## Implementation

We will initially work with a small subset of three or four MOC hosts
in order to develop an appropriate configuration.

There may be some hosts for which this solution does not apply (e.g.,
those that are entirely managed by another mechanism). We will
consider how best to identify and manage those hosts in a future task.

### Author(s)

Primary author:
  - Lars Kellogg-Stedman <lars@redhat.com>

### Milestones



### Work Items

List any concrete steps we need to take to implement the policy.

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
