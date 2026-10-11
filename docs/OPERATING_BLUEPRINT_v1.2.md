# Apply Once Organization Edition — Operating Blueprint v1.2

## Product definition

Apply Once Organization Edition is an organization-owned employment network that connects curated employer opportunities to adult job seekers and preserves the employer knowledge a workforce organization develops over time.

Staff bring people into the system. Job seekers manage their own applications. Organizations manage employer relationships and curated opportunities. The customer operates the system and owns its data. Apply Once provides the infrastructure.

## Core model

Organization side:
- employer relationships
- employer contacts
- employer activity
- curated opportunities
- staff-to-job-seeker connections
- employment outcomes and reporting

Job seeker side:
- employment profile
- organization-curated opportunities
- independent application activity
- interview/hire status
- employment outcome reporting

Employment loop:
**Employer → Opportunity → Organization → Job Seeker → Application → Outcome**

Relationship loop:
**Employer → Contact → Staff Activity → Next Step → Relationship History**

## Boundaries

- Adult job seekers age 18+
- One active organization connection at a time
- No minor/guardian workflow in v0.1
- No public job board inside Organization Edition
- No aggregated job feed inside Organization Edition
- No full case-management replacement
- No separate staff-to-employer referral workflow

## Outcome attribution

Every hire by a connected job seeker counts toward the organization holding the active connection on the employment start date.

Report separately:
- Total hires
- Hires through organization opportunities

## v0.1 required capabilities

Organization:
- workspace
- multiple admins
- staff accounts
- deactivation and reassignment
- strict tenant isolation

Employer network:
- employers
- duplicate warning
- multiple contacts
- activity history
- relationship owner
- next steps
- continuity-risk reporting

Opportunities:
- Job
- Apprenticeship
- Work Experience
- staff submission
- verification
- Draft / Active / Filled / Expired / Removed
- organization-only visibility

Job seekers:
- age 18+
- one active organization connection
- staff connection tracking
- organization-curated opportunities

Applications/outcomes:
- job-seeker-owned applications
- outcome tracking
- total organization hires
- hires through organization opportunities
- wage amount + pay period
- verification source

Data:
- CSV import
- CSV export

## Product development rule

A feature should help at least one of these:
1. know and preserve employer relationships;
2. manage relevant opportunities;
3. help an adult job seeker access employment through their organization;
4. understand employment results of people connected to AO.
