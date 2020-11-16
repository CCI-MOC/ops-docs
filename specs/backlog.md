# Creation of Backlog as a Ranked List

We want to ensure that decisions about what to work on incorporate a priority agreed to by the team, product owners, partners and customers. Specifically, we want to reach the point that:

- Prioritization is clear so that decisions and trade-offs may take an issues priority into account.
	- this should be visible by a Rank Order List and, where appropriate, an explanation of the prioritization (example below).
- The teams priorities are visible to interested parties. 
- Items "ready to be worked on" state is easily identifiable.
- The tool/process we use should react automatically to changes in Github issues and pull requests.
- We have the flexibility to move items from a common backlog to sprints without reworking the item.
- Movement of items through workflow (sprint or otherwise) is reflected in the backlog - eg. an item moved to a "done" state in a sprint should show as "done" in the backlog.

## Problem Description

Several changes are occurring to the MOC teams development models at the same time.

- We are moving to [repository based operations](https://github.com/CCI-MOC/ops-docs/blob/master/specs/devops-mvp.md)
- Development resources from partners, open source projects, interested operators, and students will play a larger role in the future.

Given the core teams small size we need to change our methodology to enable:

- Knowledge sharing and, more importantly, solution sharing, between team members
- Capturing those solutions and knowledge, as well as the information identified in section 1 above, in a way that a larger community may find and use it. 
- The swarming of problems by multiple developers.

A common backlog of MOC issues is one way to capture common understandings and enable rapid on-boarding of development resources. 

The team has settled on GitHub Projects and Issues as the tool of choice. It meets the requirements outlined in the first section above and is tightly coupled with our repository of choice, GitHub. 

## Policy

The items in a backlog should be mutable both in their contents and their relative prioritization. Those changes should occur because of actions of the team, or team members, not due to side effects of the underlying tool.

To ensure that level of order and flexibility issues should be created in the repository closest to the relevant code and also tracked in the backlog for the development team.  

Github supports this model inherently in their [Kanban model](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/about-project-boards) and, with a little bit of work can support it for scrum as well.  <--- we will need to validate by usage that the overhead is not onerous.  Also, a discussion of [Kanban or Scrum](https://www.mountaingoatsoftware.com/blog/when-kanban-is-the-better-choice) --->

1. Issues should be written associated with the repository closest to the section of relevant code.  For example a hil/bmi issue would be created in CCI-MOC/hil. If no repository is appropriate they may be added directly to the [mocbacklog](https://github.com/orgs/CCI-MOC/projects/8).   
2. If you add the issue to the repository,whenever possible add the repository to [Linked Repositories](https://github.com/orgs/CCI-MOC/projects/8/settings/linked_repositories) under the Menu.  This way it will be included in default searches.  
3. To find and order all cards available across all cci-moc repositories execute this search in the [add card](assets/githubaddcards.png) dialog:
 
    org:CCI-MOC state:open is:issue is:open repo:*
    
This is part of a larger effort to make the work of managing the MOC, and by extension the [Open Infra Labs](https://openinfralabs.org) work open and more inviting for partners and the community to participate in.  This is not intended to capture all the work being done on the MOC, rather it is focused on the core dev and ops teams work.   If this changes over time we will revisit the policy and make adjustments.    
 
### Backlog Setup/Additions
1. Open [mocbacklog](https://github.com/orgs/CCI-MOC/projects/8)
2. Click + Add cards on the right side of the project board
3. In the search field use this search: `org:CCI-MOC is:open is:issue repo:*`,  making sure "Only show results from linked repositories" is *not* checked.
4. Drag the cards that show in the search results to the BackLog column add them <--- as a team figure out if we need two columns, one for order or "Ready to be worked" --->.
   It should look something like [this](assets/fillbacklog.png) when you do it. 
    
### Scrum Setup
1. Open [mocbacklog](https://github.com/orgs/CCI-MOC/projects/8) 
2. Create a new Scrum Project with the name based on starting and end dates - eg. Sprint week 46 and 47 based on number for weeks of year.  
3. In Sprint Planning Meeting items in [mocbacklog](https://github.com/orgs/CCI-MOC/projects/8) are added to a sprint project board following [these instructions](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/adding-issues-and-pull-requests-to-a-project-board#adding-issues-and-pull-requests-to-a-project-board-from-the-sidebar).


## Alternatives & History

Other approaches:
1. Use Github Kanban model and do not have separate Scrum Boards for each sprint.   
2. Automate the moving of the backlog between scrum boards every sprint. 

## Implementation

### Author(s)

Primary author:
  - Michael Daitzman <msd@bu.edu>

Other contributors:
  - team discussion

### Milestones

Policy will go into affect on Nov 16, 2020.

We should review the approach during each sprint and during retrospectives to evaluate changes which will increase the teams productivity.

### Work Items

1. Move items over from [Infrastructure Trello Board](https://trello.com/b/wRPeYuIx/infrastructure-board).
2. Team meet to identify gaps and order Backlog.

## References
Not a definition of a Backlog, but a set of good practices:[Product BackLog Spring Cleaning](https://www.mountaingoatsoftware.com/blog/4-tips-for-spring-cleaning-your-product-backlog)

## License

This work is licensed under a Creative Commons Attribution 3.0
Unported License.
http://creativecommons.org/licenses/by/3.0/legalcode
