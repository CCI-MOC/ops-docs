---
title: Integrating Red Hat Directory Server with Keycloak
standards:
- nist-ia
- nist-au
---

## Context

Our user community authenticates exclusively via OIDC and is served well by
our Keycloak IdP. On the other hand, as operators we often need to
authenticate to devices or services without OIDC support, including:

- SSH logins to Linux hosts
- Web or ssh access to baseboard management controllers, like Dell iDRACs
- Web or ssh access to network devices like switches, routers, and
  firewalls

All of this is currently accomplished using shared accounts, which means
there is no record of who logged into a device. If someone leaves or a
password is compromised, it means we have to roll out new shared passwords
across the entire environment. In order to provide better access control and
better audit logs, we would like to be able to use individual accounts for
these sorts of activities.

Furthermore, as we start architecting a NIST compliant environment, there are
specific requirements around identity and auditing that we need to meet:

- [NIST SP 800-171 Requirement 3.5.1][nist-351] requires that all system users must be
uniquely identified before accessing organizational systems.

- [NIST SP 800-171 Requirement 3.3.2][nist-332] requires that all actions can be tracked
directly back to a specific human actor to support non-repudiation.

[nist-351]: https://csf.tools/reference/nist-sp-800-171/r2/3-5/3-5-1/
[nist-332]: https://csf.tools/reference/nist-sp-800-171/r2/3-3/3-3-2/

Most of the devices and servers that we use have support for authenticating against an
LDAP directory. By setting up an LDAP directory and federating the LDAP
accounts with Keycloak, we are able to:

- Use individual accounts for access to a variety of devices, solving both
  the access control and the audit issues.
- Allow the use of a single set of credentials for both OIDC and non-OIDC
  authentication.

## Decision

We will use [Red Hat Directory Server][rhds] (which is Red Hat's commercially
supported version of [389 Directory Server][389ds]) to provide LDAP service. If
the MOC does not have a license for RHDS we can fall back to 389ds without any
change in functionality.

[rhds]: https://www.redhat.com/en/technologies/cloud-computing/directory-server
[389ds]: https://www.port389.org/

RHDS will run in EKS alongside Keycloak, but unlike Keycloak the LDAP service
will not have a public endpoint. We will provide connectivity from MOC internal
networks to AWS by setting up an [AWS site-to-site VPN][vpn].

[vpn]: https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html

We will enable password authentication to Keycloak and the Keycloak
self-service portal. This will allow self-management of LDAP passwords via
the Keycloak UI.

LDAP will be authoritative for a subset of groups used to control operations
access to services. It will be possible to add operations users to
non-LDAP groups managed in Keycloak.

All connections to the LDAP service will be encrypted, either through the
use of LDAPS (LDAP-over-SSL) or through the use of the `StartTLS`
operation.

### Validation

- RHCOS on our OpenShift nodes have both `sssd` and `sssd-ldap` pre-installed.

  We will configure standalone OpenShift clusters using MachineConfig
  resources. Hosted Control Planes clusters must be configured via their
  NodePool resources.

- Dell iDRACs can be configured to support LDAP authentication.

- Lenovo XClarity 2 controllers can be configured to support LDAP authentication.

### Handling MFA access

[NIST SP 800-171 Requirement 3.5.3][nist-353] requires the use of MFA for all local and
network-access to privileged accounts, and for network access to non-privileged
accounts. Many of our devices have no native support for MFA. We may be able to
implement a compensating control via one of the following solutions:

[nist-353]: https://csf.tools/reference/nist-sp-800-171/r2/3-5/3-5-3/

- By implementing a dedicated VPN with enforced MFA, or
- By implementing a bastion host with enforced MFA, or
- Both!

In either case, operators must first authenticate to the gateway before they
are able to access devices such as server BMCs. This solution will need to be
validated by a NIST 800 171 subject matter expert.

### Organization of the LDAP directory

| Purpose       | DN                             |
| ------------- | ------------------------------ |
| Base DN       | dc=massopen,dc=cloud           |
| User accounts | ou=people,dc=massopen,dc=cloud |
| Groups        | ou=groups,dc=massopen,dc=cloud |

#### Users

We will represent user accounts with the following object classes:

- `person`
- `organizationalPerson`
- `inetOrgPerson`
- `posixAccount`
- `nsAccount`

`nsAccount` is native to RHDS and includes the `nsSshPublicKey` attribute,
which we will use for storing the public keys of operators in order to
configure ssh connections to platforms that support public key
authentication.

```ldif
dn: uid=alice,ou=people,dc=massopen,dc=cloud
objectClass: top
objectClass: person
objectClass: organizationalPerson
objectClass: inetOrgPerson
objectClass: nsAccount
objectClass: posixAccount
cn: Alice Example
givenName: Alice
sn: Example
mail: alice@example.com
userPassword: {SSHA}hashedpasswordgoeshere
uidNumber: 10000
gidNumber: 10000
homeDirectory: /home/alice
loginShell: /bin/bash
```

#### Groups

We will represent groups using the `groupOfNames` object class:

```ldif
dn: cn=openshift-admins,ou=groups,dc=massopen,dc=cloud
objectClass: top
objectClass: groupOfNames
cn: OpenShift Administrators
description: Users with cluster-reader + impersonation access in OpenShift
member: uid=alice,ou=people,dc=massopen,dc=cloud
```

We will use the [memberOf plugin] to synthesize a `memberOf` attribute on
user account entries for each group of which they are a member. This value
is required by some systems (e.g., the Lenovo XClarity 2 BMC) to determine
group membership.

[memberOf plugin]: https://docs.redhat.com/en/documentation/red_hat_directory_server/11/html/administration_guide/Advanced_Entry_Management#groups-cmd-memberof

### Attribute mapping

| LDAP attribute | Keycloak attribute |
| -------------- | ------------------ |
| uid            | username           |
| mail           | email              |
| givenName      | firstName          |
| sn             | lastName           |
| nsSshPublicKey | sshPublicKey       |

### Backups

We will periodically (e.g., via a CronJob) perform an LDIF export of the
directory and save it to an object bucket hosted by Wasabi or Backblaze.

### Break glass/emergency authentication

We need a way to log into to servers and devices if the directory service is down.

For every enrolled host or device, we will generate a random administrative
password and store it in our secret store. We may want to investigate
periodically rotating these static credentials, but the initial plan is simply
to have a unique password per device, and some sort of audit event on the
secret store that shows us when or if these credentials are accessed.

## Consequences

### Benefits

- We are able to comply with NIST identity (IA) and auditing (AU) requirements
- We can manage access for operations users to OpenShift clusters,
  individual Linux hosts, and network devices from a single place.
- We are able to use individual credentials when logging into
  infrastructure systems.

### Changes

- We become the primary authentication source for operations users. We may
  still be able to supported federation with upstream identity providers
  for OIDC login, but we will own the primary credentials.

## See also

- [RFC-01: MOC 2.0 IdP](https://docs.google.com/document/d/1KxFjhMipJYHqxqouS3fmcxWsji-R8AIdVBCNIrWKd0A/edit)
- [RFC-14: Keycloak](https://docs.google.com/document/d/1Cs1zQF3rByGV4yjMd6NAPbX7uK-BP6Wayo-FJobU2Vs/edit)
- [NIST SP 800-171r2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171r2.pdf)
