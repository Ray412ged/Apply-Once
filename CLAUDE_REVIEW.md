# Claude Review Guide

## Goal

Evaluate the current Apply Once codebase against the Organization Edition v1.2 product model and v0.1 build plan. This is a review, not a redesign exercise.

## Primary questions

### P0 — security / correctness

1. Can a user from Organization B read or mutate Organization A data by:
   - changing route params;
   - changing request bodies;
   - calling the Base44 SDK directly;
   - using a record id from another organization?
2. Can a non-staff user invoke organization functions?
3. Can a platform admin bypass intended customer-data boundaries without logging?
4. Can connected job seekers access unverified or other-organization postings?
5. Does any frontend path still directly read JobPosting in a way that defeats Phase 1?

### P1 — product architecture

1. Does the code distinguish platform admin from org admin cleanly?
2. Does one active org link actually guarantee outcome attribution?
3. Will staff offboarding preserve history while transferring ownership?
4. Can the planned employer/contact/activity model support the continuity measure without becoming a full CRM?
5. Is the planned import/export path enough to support customer data ownership?

### P2 — maintainability / usability

1. duplicated authorization logic
2. naming inconsistencies
3. stale status logic
4. frontend/backend contract drift
5. unnecessary complexity
6. missing tests

## Specific Phase 1 files to inspect first

- `base44/shared/orgAuth.ts`
- `base44/entities/OrganizationStaffAccount.jsonc`
- `base44/entities/JobPosting.jsonc`
- `base44/functions/getMyOpportunities/entry.ts`
- `base44/functions/getJobForMe/entry.ts`
- `base44/functions/getOrgSession/entry.ts`
- `base44/functions/getOrgDashboard/entry.ts`
- `base44/functions/getOrgOutcomesReport/entry.ts`
- `base44/functions/getOrgParticipantLinks/entry.ts`
- `src/lib/orgJobs.js`
- `src/pages/Jobs.jsx`
- `src/pages/JobDetail.jsx`
- `src/pages/ApplicationWorkspace.jsx`
- `src/pages/Applications.jsx`
- `src/components/jobs/DiscoveryView.jsx`
- `src/components/organization/OrgLayout.jsx`
- `src/App.jsx`

## Required response format

Start with a verdict:
- Ready to continue
- Continue with fixes
- Stop before Phase 2

Then provide:
- P0 findings
- P1 findings
- P2 findings
- exact file references
- what is verified vs inferred
- smallest corrective action for each issue
- whether Phase 2 should start

Do not make code changes unless explicitly requested.
