# Apply Once Organization Edition — v0.1 Build Plan

The build is organized in eight phases. Tenant isolation and secure job visibility come first.

## Phase 1 — Foundations

- Add organization roles and staff metadata.
- Add a shared organization authorization helper.
- Move existing organization functions onto the shared helper.
- Add organization ownership and verification fields to JobPosting.
- Lock direct JobPosting reads.
- Route job-seeker job reads through backend functions.
- Create the Organization Edition shell.
- Verify non-org users cannot access organization functions.

## Phase 2 — Employer Network

Create:
- OrgEmployer
- EmployerContact
- EmployerActivity

Add:
- duplicate warning
- employer search
- activity timeline
- open next steps
- relationship ownership

## Phase 3 — Opportunities

- organization-owned postings
- staff submission
- Unverified → admin review → Verified + Active
- submitter can see status
- only verified active opportunities appear to job seekers

## Phase 4 — Connections

- staff connection codes
- 18+ confirmation
- capture connecting staff member
- organization consent details
- staff connection counts

## Phase 5 — Applications and Outcomes

- Hired
- Closed – No Response
- EmploymentOutcome
- total hires
- hires through organization opportunities
- staff verification
- wage + period

## Phase 6 — Staff Offboarding

- deactivate staff
- identify employers, contacts and next steps still owned
- force reassignment before deactivation
- preserve historical activity attribution

## Phase 7 — Import / Export

- CSV import for employers, contacts and opportunities
- dry-run duplicate/validation review
- CSV export for customer-owned organization data

## Phase 8 — Reporting / Pilot Hardening

- employer activity
- continuity risk
- opportunity metrics
- connection counts
- application/interview/hire outcomes
- tenant-isolation testing
- access/retention/continuity policies

## Phase 1 acceptance target

A connected job seeker must receive only their organization's verified active opportunities. An independent job seeker must not see organization-owned postings. An organization function must reject a caller without an active OrganizationStaffAccount. Direct JobPosting reads by ordinary users must not expose private organization opportunities.
