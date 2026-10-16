# MOC Operations Documentation

This repository is the central home for documentation related to operating the
MOC environment. It brings together architecture decision records, technical
documentation, policies, and records of production changes in a single place,
with each category managed through pull requests and reviewed according to its
own approval requirements.

The canonical URL for this repository is <https://github.com/cci-moc/ops-docs>.
The documentation in this repository is published to
<https://ops-docs.massopen.cloud>.

## Architectural Decision Records (ADRs)

The [`adrs`](adrs) directory contains Architectural Decision Records. Quoting from <https://adr.github.io/>:

> An Architectural Decision (AD) is a justified design choice that addresses a
> functional or non-functional requirement that is architecturally significant.
> An Architectural Decision Record (ADR) captures a single AD and its
> rationale; Put it simply, an ADR can help you understand the reasons for a
> chosen architectural decision, along with its trade-offs and consequences

### Creating a new ADR

1. Copy the ADR template to a new subdirectory of [`adrs`](adrs). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```
    cp -a templates/adr adrs/2026-10-15-ops-docs-repository
    ```

2. Edit the `README.md` file in the new directory to create your ADR.

3. Submit a pull request with your changes.

### Approval

TBD.

## Technical Documentation

The [`docs`](docs) directory contains technical documentation. Unlike an ADR, which documents a single technical decision, documentation in the `docs` directory describes the existing state of the environment. It may contain how-to documentation, run books, network diagrams, and other such material.

### Creating a new technical document

1. Copy the docs template to a new subdirectory of [`docs`](docs). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```
    cp -a templates/doc docs/2026-10-15-oac-prod-networking.md
    ```

2. Edit the `README.md` file in the new directory to create your document.

3. Submit a pull request with your changes.

### Approval

Because documents in the `docs` directory describing what currently exists and do not require any decisions, they only require our standard two reviews before merging.

## Policies

The [`policies`](policies) directory contains documentation on policies that we follow in the MOC environment.

### Creating a new policy

1. Copy the policy template to a new subdirectory of [`policy`](policy). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```
    cp -a templates/policy policy/2026-10-15-adr-approval-process
    ```

2. Edit the `README.md` file in the new directory to create your policy.

3. Submit a pull request with your changes.

### Approval

TBD.

## Production Change Requests

The [`production-changes`](production-changes) directory contains a log of changes made to our production environments. If you need to perform production-impacting maintenance, you create a pull request with information about the required maintenance action. Once your PR is approved you are free to perform the described action, and the document becomes a permanent record of that maintenance.

### Creating a new production change request

1. Copy the policy template to a new subdirectory of [`policy`](policy). The new directory name should have the format `YYYY-mm-dd-title`, so for example:

    ```
    cp -a templates/production-change production-changes/2026-10-15-delete-observability-pvc
    ```

2. Edit the `README.md` file in the new directory to create your change request.

3. Submit a pull request with your changes.

### Approval

TBD.
