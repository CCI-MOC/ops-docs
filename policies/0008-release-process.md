# Creating a standard software release process

This documents defines the set of standards and practices that we use for releasing artifacts.

## Problem Description

So far we've worked individually on developing software, each one adopting their own set of standards for the code and software we are respectively responsible for.
As we come together as a team we need to adopt a common set of standards.

## Policy

- We have a formal release process and we version the released artifacts.
- We use semantic versioning and create the respective releases (and their corresponding tag) on GitHub.
- We write a brief description of what's changed or been fixed before releases in the description of the release.
- We package applications and services as container images.
- We use a workflow to build the image every time a new PR gets merged on the main/master branch or a new release gets created.
- Unless otherwise required, we deploy software that we have previously released by referencing the desired version on the tag of the image.

## Alternatives & History

TODO

## Implementation

### Author(s)

Primary author:
  - Kristi Nikolla <knikolla@bu.edu>

Other contributors:
  - Rest of team

### Milestones

Work Items below does a good job highlighting the steps and milestones.

### Work Items

- Go through our repos and enumerate the released artifacts for each.
- Create the required workflows for building them.
- Create an initial release.
- Update deployment scripts and manifests to reference released versions.

## References

* [Semantic Versioning](https://semver.org)

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
