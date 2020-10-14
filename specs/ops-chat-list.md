# Create an ops-chat mailing list

Create an `ops-chat` mailing list for discussions around MOC operations. The
list will explicitly *not* be for automated alerts.

## Problem Description

We sometimes want to have conversations or share documentation that isn't well
suited to a chat channel. We should create a mailing list for that purposes.

## Policy

We will create an `ops-chat` mailing list, the membership of which should
probably mirror the membership of the `#coredev` slack channel. We will
initially subscribe the ops team, but membership will not be mandatory.

## Alternatives & History

There is an existing `ops` mailing list, but this list is used as the target
for automated alerts and for contacts from outside the organization. We should
keep our discussion list separate to allow people to select which
communications they want to receive.

Our local mailing lists are hosted using [mailman][]. There has been some
interest in selecting a hosted alternative (e.g. [Google groups][],
[groups.io][], etc). Hosted solutions may require a monthly subscription, and a
free solution like Google Groups may introduce advertising.

There are third-party mail archiving solutions available that may provide a
better experience than the default Mailman UI.

[mailman]: https://list.org/
[google groups]: https://groups.google.com/
[groups.io]: https://groups.io/

## Implementation

### Author(s)

Primary author: <lars@redhat.com>

### Milestones

We will create the mailing list when this policy merges.

### Work Items

- Create the `ops-chat` mailing list in mailman.

- (optional) Establish a list archive separate from mailman

## References

- <https://mail.massopen.cloud/mailman/listinfo/ops>

  Existing `ops` list.

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
