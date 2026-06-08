# Enforce Requiring Two Factor Authentication for Organization Members

This policy proposes turning on the Github setting that requries every
organizaion member to turn on Two Factor Authentication (2FA).

## Problem Description

In addition to using Github for hosting our code we also use github for:

- Automated building and publishing of container images
- Identity provider for some of our OpenShift clusters. Most of the time,
these users are administrators on our cluster.
- Automated deployment of infrastructure changes.
- Changes to billing policy like outages, rates etc.

A compromised account can cause some serious damage.

## Policy

This policy mandates that all members of the GitHub organization must have 2FA
enabled. This will be enforced globally via the GitHub organization settings.

**Note on Scope:** Enforcing 2FA is not a silver bullet for organization security,
but it effectively closes one of the most common and high-risk pathways to
credential theft and unauthorized access.

## Alternatives & History

None

## Implementation

### Author(s)

Primary author:

  - naved001

### Milestones

1. 2026-06-20: Identify and inform users without 2FA.

https://github.com/orgs/CCI-MOC/people?page=1&query=two-factor%3Adisabled

2. 2026-07-01: Enforce organization wide 2FA

### Work Items

1. We'll need to notify some of our users who currently do not have 2FA
turned on as they will be kicked out of the org as soon as 2FA is turned on.

2. Enforce 2FA in the github org setting.

3. Help users rejoin the organization who were removed from the org as a result
of turning on 2FA requirement.

## References

https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization#requiring-secure-methods-of-two-factor-authentication-in-your-organization

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
