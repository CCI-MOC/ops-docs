---
title: Local certificate authority
standards:
- nist-sc
- nist-ac
---

## Context

There are situations at the MOC in which we want to secure access to a
device or service with TLS certificates, but for various reasons we are not
able to take advantage of existing certificate issuers.

### Data encryption in transit

[NIST SP 800-171 Requirement 3.13.8][nist-031308] requires that CUI
(Controlled Unclassified Information) be encrypted both at rest and in
transit. Encryption at rest is generally provided by the cryptographic
features of our storage appliances and servers. Encryption in transit
requires co-operation between our storage appliances and our storage
clients, and in the MOC environment the only viable option is NFS-over-TLS.

[nist-031308]: https://csf.tools/reference/nist-sp-800-171/r2/3-13/3-13-8/

In order for NFS-over-TLS to be effective, we need to establish a certificate
trust relationship between the storage clients and the certificate presented by
the storage server. One way to establish this is through the use of self-signed
certificates, which is our current solution, but this presents some challenges:

- With self-signed certificates, every client requires individual configuration
  (because each client cluster gets its own realm, and we generate a
  certificate for each realm).

- Any time we want to rotate the certificate, we also have to update the client
  configuration because the new certificate shares no common trust root with
  the previous certificate.

We are not able to acquire a certificate from an existing trusted CA like Let's
Encrypt, because it is not possible to obtain Let's Encrypt certificates for
private IP SANs ([Subject Alternative Names][san]). Using an internal
certificate authority means we can issue certificates for arbitrary names and/or
addresses.

[san]: https://support.dnsimple.com/articles/what-is-ssl-san/

### Securing device access

We often access server BMCs and other network devices ([Baseboard Management
Controllers][bmc]) via IP address, which brings us to the same problem
described in the previous section -- it is not possible to acquire generally
trusted certificates for these addresses. This means that every device access
is preceded by negotiating the browser's untrusted certificate workflow.
Setting up a local CA and installing the CA certificate in our browsers would
make the process of accessing these devices more convenient and more secure.

[bmc]: https://www.supermicro.com/en/glossary/baseboard-management-controller

[NIST SP 800-171 Requirement 3.1.13][nist-031113] requires that we employ
cryptographic mechanisms to protect the confidentiality of remote access
sessions, which includes the kind of administrative access we use to manage
server BMCs. A local CA lets us issue trusted certificates for these
devices so that this encryption can be relied upon and verified, rather
than trained away by a habitual "click through the warning" workflow.

[nist-031113]: https://csf.tools/reference/nist-sp-800-171/r2/3-1/3-1-13/

## Decision

We will use [step-ca] as our local certificate authority, running in one of
our internal OpenShift clusters.

[step-ca]: https://smallstep.com/docs/step-ca/

step-ca exposes an API for issuing and renewing certificates, which lets us
automate certificate management instead of relying on someone to run
commands by hand. In particular, this lets us set up non-interactive
processes for automating the certificate renewal process, which would
otherwise require manual remediation for every device. Automating this
process makes it much easier to support certificates with short lifetimes,
which is important in situations in which certificate revocation is not an
option. Short certificate lifetimes limit the damage that can be caused by
a compromised certificate.

We will start with the Let's Encrypt default 90-day certificate lifetime
for all certificates, but we will investigate shortening this lifetime as
our automation tooling becomes more robust.

An API-driven CA also avoids the coordination problems inherent in an
approach like OpenSSL plus a git repository, where the CA state is a set of
files that multiple people might edit at the same time. step-ca provides
centralized issuance and managed CA state, so there's no risk of
conflicting edits or duplicate serial numbers.

We can use policies to limit the scope of certificates that can be issued by
our CA -- e.g., by restricting it to issuing certificate with IP SANs in
specific network ranges, and limiting DNS SANs to specific domains (this allows
us to prevent someone from using a trusted certificate authority to issue
certificates for things like `google.com`).

step-ca also supports the ACME protocol, the same protocol used by Let's
Encrypt. This means in some situations we can use standard ACME clients to
request and renew certificates from our internal CA, rather than writing
custom tooling against a step-ca-specific API.

### Multi-level certificate authority

step-ca sets up a two-tier certificate authority by default. Server
certificates are signed by an intermediate CA, which is itself signed by
the root CA. This is done in the interests of security -- once the
intermediate CA has been established, the root CA secret does not need to
be exposed anywhere.

We will install the root CA certificate in browsers and servers that need
to trust generated certificates, and we have servers present a certificate
chain that includes the intermediate certificate.

### What needs to be backed up?

The critical parts of the certificate authority are the root certificate
and private key, which will be stored securely in AWS Secrets Manager.

Because trust is anchored in the root CA, the intermediate CA can be
treated as replaceable: if the step-ca instance is lost, a new intermediate
CA keypair can be generated and signed by the root CA without
re-distributing trust anchors to clients.

Existing endpoints will continue to validate as long as they serve the full
certificate chain (leaf + original intermediate) that was issued to them.
However, any endpoint requiring re-issuance will need a new certificate
generated under the new intermediate CA.

### Certificate installation and renewal

For this to be effective, it must be possible to automate certificate
provisioning and renewal. In this section, we look at how to accomplish
this on specific devices. Actually building this automation is outside the
scope of this ADR.

In general, we will use one of the following general workflows, in order of
preference:

1. Automated certificate provisioning and renewal via SCEP or ACME.

   This permits a device or server to autonomously manage its own
   certificate without requiring any operator intervention once the
   appropriate client has been configured.

   On Linux servers there are a number of software packages with the
   necessary support (certbot, acme.sh, etc). Support in other devices
   varies depending on the manufacturer and product version.

2. Generate a CSR on the device, sign it, and install certificate.

   A device provides a mechanism for generating a CSR, which we sign using
   our certificate authority in order to issue a certificate. This has the
   advantage of keeping the secret key entirely on the client -- we don't
   have to create the secret, transfer it, or otherwise interact with it.

   Our existing iDRAC and Xclarity BMCs provide this facility, as does the
   FlashBlade.

3. Generate a key and certificate externally and install on the device.

   We generate a private key and certificate locally and then upload both
   to the target device. This is the least preferred mechanism, since it
   requires managing cryptographic secrets.

#### FlashBlade

- Certificates can be managed via the [REST API].
- There is an [ansible module] that can manage certificates on the
  FlashBlade.
- It is possible to request a CSR from the flashblade (option 2, above)
- There is a
  [feature request](https://purecommunity.purestorage.com/discussions/array-management/feature-request-certificate-automation-with-acme/3566)
  for ACME support on the FlashBlade, but that has not been implemented
  yet.

[rest api]: https://code.purestorage.com/swagger/redoc/fb2.0-api-reference.html#tag/Certificates
[ansible module]: https://galaxy.ansible.com/ui/repo/published/everpure/flashblade/content/module/purefb_certs/

#### Dell iDRAC 8

- Use remote `racadm` to generate CSR and to upload signed certificate. See
  [`update-idrac-cert.sh`](update-idrac-cert.sh.txt) for an example. Activating
  the new configuration requires an iDRAC reset, which renders the iDRAC
  unavailable for several minutes (it does not impact the server itself).

#### Dell iDRAC 9

- Newer Dell hardware (iDRAC 9 and later) supports [automatic certificate
  renewal] using [SCEP] (and step-ca has built-in SCEP support).

[automatic certificate renewal]: https://infohub.delltechnologies.com/en-us/p/dell-poweredge-idrac-automatic-certificate-enrollment/
[scep]: https://en.wikipedia.org/wiki/Simple_Certificate_Enrollment_Protocol

#### Lenovo xClarity 2

- Use redfish to generate a CSR and to upload the signed certificate. See
  [`update-xcc-cert.sh`](update-xcc-cert.sh.txt) for an example.

### Rejected options

#### OpenSSL

We can use the OpenSSL command line tool to operate a
[simple certificate authority][osca]. This has the advantage of not
requiring any infrastructure, but it introduces coordination problems if
more than one person is to be able to issue certificates, and it largely
eliminates the possibility of API-driven automated renewal.

[osca]: https://openssl-ca.readthedocs.io/en/latest/introduction.html

If we wanted to implement policy restrictions, we would need to write our
own code to mediate the certificate process.

#### AWS

AWS offers a private certificate authority service, [AWS Private CA]. While
this would undoubtedly meet our needs from a technical perspective, it is a
much more expensive solution (there are monthly costs for each CA, for the
number of certificates issued each month, and for any uses of the [OCSP]
protocol).

[aws private ca]: https://aws.amazon.com/private-ca/
[ocsp]: https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol

## Consequences

- By running our own internal certificate authority we are able to properly
  secure access between our storage clients and the FlashBlade appliance,
  and between operator browsers and the devices that we manage.

- We will need to distribute the CA certificate to storage clients and
  browsers.

- We will need to install and operate the step-ca service.

## See also

- [Production considerations when running a certificate authority server](https://smallstep.com/docs/step-ca/certificate-authority-server-production/#safeguard-your-root-and-intermediate-keys)
- <https://smallstep.com/blog/build-a-tiny-ca-with-raspberry-pi-yubikey/>
