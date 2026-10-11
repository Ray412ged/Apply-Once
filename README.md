# Apply Once

Private source mirror of the current Base44 **Apply Once** application for independent technical review.

## Current product direction

The current development target is **Apply Once Organization Edition v0.1**: an organization-owned employment network connecting employer relationships and curated opportunities to adult job seekers age 18+.

The current Base44 checkpoint represented here is:

**AO Organization Edition v0.1 — Phase 1 Foundations**

Phase 1 establishes:
- organization staff roles
- organization authorization resolved server-side
- organization-scoped job visibility
- secure job reads through backend functions
- the Organization Edition workspace shell

## Review order

1. Read `docs/OPERATING_BLUEPRINT_v1.2.md`
2. Read `docs/BUILD_PLAN_v0.1.md`
3. Read `ARCHITECTURE.md`
4. Read `CLAUDE_REVIEW.md`
5. Review the code, especially `base44/shared/orgAuth.ts`, `base44/functions/getMyOpportunities/`, `base44/functions/getJobForMe/`, entity RLS, and organization routes.

This repository is intended for review first. Do not make changes unless Raymond explicitly asks for implementation.
