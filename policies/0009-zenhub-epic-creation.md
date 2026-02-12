# ZenHub Epic Creation

An Epic is a large body of work or a major feature that's too big to be
completed in a single sprint, serving as a high-level container for
related, smaller work items called User Stories or Issues. Think of it as
a strategic goal or an overarching objective (like "Build a Mobile App")
that gets broken down into manageable User Stories (like "User Login,"
"Product Browsing," "Checkout") that teams can tackle in shorter
development cycles (sprints). Epics provide focus, organization, and a
clear path for delivering significant value over time.

## Problem Description

For epics to be useful, it is best to follow similar steps for creating and using epics. In this way, we can ensure a more useful and organized outcome.

## Alternatives & History

Epics created directly from GitHub Issues can only have issues from the same Repo added to the Epic.

If you wish to add issues from other Repos, let alone other Organizations, you will need to utilize ZenHub Issues of Type Epic.

In the past, ZenHub managed its epics as separate entities, and those can still be found if you have the old links. These are no longer used, and therefore, we will not discuss them further here.

## Policy

ZenHub is where we currently manage our epics, and therefore, we will be using ZenHub to create our Epics. The way that ZenHub manages Epics is by utilizing a similar process as GitHub. Epics are Issues of Issue Type Epic. This means that you can convert issues to Epics by changing their Issue Type. This can be confusing because there are ZenHub Issues and Git Hub Issues, and they both create slightly different Epics.

### Steps to create a ZenHub Epic

1. log into [ZenHub](https://app.zenhub.com/login)
2. Create an Epic Template
   1. Browse to this epic[ZenHub Epic Template](https://app.zenhub.com/workspaces/moc-a--rh-sprint-workspace-62a210f69d42f600151deae0/issues/zh/322)
   2. Duplicate it
      1. Click the ellipsis in the upper right ![ellipsis](/policies/assets/ZHellipsis.jpg)
      2. Select Duplicate issue
   3. OR
   4. Create a new ZenHub Issue
      1. Press n + z keys
      2. OR
      3. Click the Create button in the upper right ![Create](/policies/assets/ZHcreate.jpg)
      4. Select Zenhub Issue
      5. Paste the following into the Issue body
         ```
         # Motivation
         
         # Completion criteria
         
         # Description
         
         # Requirements
         
         ```
   5. Provide a Title for the epic
      1. Try to name it something that explains why we are doing it
3. Add sub-issues to the epic
   1. Scroll down past the Requirements section of the body
   2. Click the search area under the Sub-issues section [Sub-issues](/policies/assets/ZHsubissues.jpg)
   3. Type in the name of the issue you wish to add
   4. Select the issue you wish to add from the list
   5. Repeat until your Epic has all the issues you want
4. We cannot add GitHub issues to ZenHub Epics from the Issue page
   1. This feature works if we create our Epic in GitHub only
   2. We need to add them from the ZenHub Epic

### Steps to create a GitHub Epic

Cannot include issues from other Repos or Organizations.

1. Log in to GitHub
2. Create a new issue
3. Set the Issue Type to Epic
4. Provide a Title for the epic
   1. Try to name it something that explains why we are doing it
5. Paste the following into the Issue body
```
# Motivation

# Completion criteria

# Description

# Requirements

```
6. Add sub-issues
7. OR
8. From issue, add Parent
   1. Click Relationships on the right side
   2. Click Add Parent
   3. Search for parent
   4. Click the desired parent

## Implementation

### Author(s)

Who is leading the writing of the policy? If more than one person is
working on it, please designate the primary author and contact.

Primary author:
  - <joachimw@bu.edu>

Other contributors:
  - None (Yet)

### Milestones

This policy is already in effect.

### Work Items

- Let all Engineers know this is how Epics will work moving forward.

## References

* [ZenHub Issue Creation](https://app.zenhub.com/workspaces/moc-a--rh-sprint-workspace-62a210f69d42f600151deae0/issues/zh/new)
   * You can also hold down n+z in ZenHub to open a new ZenHub issue

* [ZenHub Epic Template](https://app.zenhub.com/workspaces/moc-a--rh-sprint-workspace-62a210f69d42f600151deae0/issues/zh/322)

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
<http://creativecommons.org/licenses/by/3.0/legalcode>
