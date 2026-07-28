# RepFlow V10 Launch Runbook

## Release gates

A production release is allowed only when all of the following pass:

1. Database migrations 001–010 apply without error.
2. `npm run typecheck` passes.
3. Unit tests pass.
4. Production build passes.
5. Playwright public and auth-guard tests pass on desktop and mobile.
6. Stripe webhook signing is verified in test mode when billing is enabled.
7. Supabase RLS checks are reviewed for new tables.
8. `/api/health` and the public smoke routes respond successfully.
9. A rollback target is identified before deployment.

## Recommended launch sequence

1. Create a Supabase database backup.
2. Apply migration 010 in staging.
3. Deploy a Vercel preview.
4. Run `PLAYWRIGHT_BASE_URL=<preview-url> npm run test:e2e`.
5. Run `SMOKE_BASE_URL=<preview-url> npm run smoke`.
6. Promote the verified build to production.
7. Run the same smoke command against production.
8. Record the release in `app_releases` and mark it verified.
9. Invite the first small beta cohort.
10. Review errors, audit logs, signups and workout completion daily during the first week.

## Rollback triggers

Rollback immediately for authentication failure, data loss, broken workout logging, incorrect subscription access, cross-user data exposure, or repeated 5xx responses on core routes.

## Beta cohort recommendation

Start with 5–10 trusted users. Expand only after at least one full weekly training cycle has completed without a critical incident.
