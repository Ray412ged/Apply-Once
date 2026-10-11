# Apply Once Architecture

## Product boundary

Apply Once Organization Edition is not a public job board or full case-management system. An organization manages employer relationships and curated opportunities. Adult job seekers connected to that organization see those opportunities and manage their own applications.

## Core organization model

- One customer organization owns its workspace data.
- Organization staff membership is represented by `OrganizationStaffAccount`.
- A participant may have one active organization connection.
- Organization staff access is resolved server-side from the active staff account.
- Client-supplied `organization_id` must never be trusted.
- Platform-admin capability is distinct from organization-admin capability.

## Phase 1 architecture

### Authorization

`base44/shared/orgAuth.ts` exposes the shared organization context resolver.

Existing org functions were moved to that pattern:
- `getOrgDashboard`
- `getOrgOutcomesReport`
- `getOrgParticipantLinks`

### Job visibility

`JobPosting` is no longer directly readable by ordinary users.

Job seekers retrieve jobs through:
- `getMyOpportunities`
- `getJobForMe`

Rules:
- a connected job seeker receives only Verified + Active opportunities owned by their active organization;
- an independent AO user receives only public postings with no `organization_id`;
- organization opportunities are not mixed into the public feed.

### Organization shell

`/org/:slug` uses `OrgLayout` and a server-backed organization session. The shell provides navigation for Employers, Opportunities, Job Seekers, Reports, and Staff. Later phases activate the employer, opportunity, and staff-management areas.

## Planned v0.1 entities

New:
- OrgEmployer
- EmployerContact
- EmployerActivity
- EmploymentOutcome

Existing entities extended during the build:
- OrganizationStaffAccount
- JobPosting
- Application
- ParticipantOrgLink
- UserProfile

## Main architectural risk to test

Tenant isolation is a server authorization problem, not a UI problem. Every organization-specific read/write must derive the caller's organization on the server and validate referenced records belong to the same organization.
