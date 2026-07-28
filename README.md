# RepFlow V14A — Exercise Intelligence Foundation

# RepFlow Next.js + Supabase V5

V5 adds the beta production-readiness layer to the V4 application.

## New in V5
- Database-backed exercise library with all 78 seed exercises
- Idempotent SQL seed migration
- Admin dashboard and exercise-library browser
- Role-protected admin routes
- First-party analytics event endpoint
- Typed analytics helper that never blocks workouts
- Database indexes and RLS policies for beta operations
- Typecheck script and beta release checklist

## Setup
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Migrations
Run `001` through `005` in order. Migration 005 creates the exercise library and analytics tables and imports all 78 exercises.

## Admin access
After creating your account, promote it once in the Supabase SQL editor:
```sql
update public.profiles set role='admin' where email='YOUR_EMAIL';
```
Then open `/app/admin`.

## Validation
```bash
npm run typecheck
npm test
npm run build
```

## Beta release checklist
- Configure production Supabase URL and anon key
- Apply all migrations in order
- Confirm exactly 78 seeded exercises
- Create one admin user
- Test RLS with two separate user accounts
- Complete assessment → programme → workout → review
- Verify analytics events insert without blocking the UI
- Configure Vercel preview and production environments
- Add privacy, terms and support contact before public release

---

# V6 — Beta Release Layer

V6 adds production deployment configuration, email verification UX, open/invite beta modes, secure invitation validation, legal drafts, a health endpoint and a formal pre-launch checklist.

## Additional environment variables

```env
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_BETA_MODE=open
```

Use `NEXT_PUBLIC_BETA_MODE=invite` to require a valid code from `beta_invites`. Never expose the service-role key to the browser.

## V6 migration

Run `006_beta_release.sql` after migrations 001–005.

## Release validation

```bash
npm run check
```

Review `docs/BETA_RELEASE_CHECKLIST.md` before inviting beta users. The Privacy Policy and Terms are product drafts and require professional legal review before public launch.

## V8 — subscriptions and entitlements

V8 adds Stripe-ready checkout, customer billing portal, webhook synchronization, subscription persistence, pricing UI, and beta-safe entitlements.

Run migration `007_subscriptions_entitlements.sql`, configure the Stripe variables in `.env.example`, and follow `docs/STRIPE_SETUP.md`. Without Stripe keys, existing beta users continue with active beta access.


## V8 Retention & lifecycle

- Onboarding completion checklist
- In-app notification inbox
- Weekly lifecycle summaries
- Inactivity-reminder preferences
- Referral-ready attribution schema
- Migration: `008_retention_lifecycle.sql`

See `docs/LIFECYCLE_OPERATIONS.md`.


## V9 Reliability & operations

- Immutable-style audit trail for privileged actions
- Operational account status model
- Admin users, audit and operations screens
- CSV exports with audit logging
- Rate-limit event persistence hooks
- Migration: `009_reliability_operations.sql`

See `docs/RELIABILITY_OPERATIONS.md`. Apply migrations `001` through `009` in order.

## V10 Quality assurance & launch operations

V10 introduces Playwright browser tests, deployment smoke checks, CI quality gates, release manifests, production launch documentation and migration `010_quality_release.sql` for deployment traceability.

### Commands

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
SMOKE_BASE_URL=https://your-domain.example npm run smoke
npm run release:manifest
```

Apply migrations `001` through `010` in order. Review `docs/LAUNCH_RUNBOOK.md` before promoting a build to production.

## V11 — Founder Intelligence Centre

V11 replaces daily athlete management with a low-maintenance owner view:

- `/app/admin/intelligence` founder dashboard
- revenue and subscription snapshot
- payment exception visibility
- intelligence insights with severity and recommendations
- honest service-health state (`unknown` when no check exists)
- scheduled `/api/cron/founder-snapshot` refresh
- migration `011_founder_intelligence.sql`

Required server variables:

```bash
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

The supplied Vercel cron refreshes the snapshot daily at 01:15 UTC. Stripe remains responsible for automatic payment retries; the founder dashboard only surfaces unresolved exceptions.

## V12 — Autonomous Operations

V12 adds an hourly, exception-only operating layer:

- deduplicated automation jobs
- safe job claiming
- automatic retry with backoff
- billing notices while Stripe owns payment retries
- optional inactivity restart notices
- generator exception escalation
- platform health records
- operational incidents
- founder automation dashboard at `/app/admin/automation`

Apply `supabase/migrations/012_autonomous_operations.sql` after migration 011. See `docs/AUTONOMOUS_OPERATIONS.md`.

## V13 — Autonomous Program Adaptation

Apply migration `013_autonomous_program_adaptation.sql`. The hourly `/api/cron/program-adaptation` job converts recent completed workout logs into safe, auditable progression decisions. Founder monitoring is available at `/app/admin/adaptation`.

## V14B — Session Builder

V14B adds deterministic session construction using movement slots, exercise-intelligence ranking, duplicate-cluster prevention, duration estimation, optional-slot trimming, generation scoring and an immutable audit trail. Apply `015_session_builder.sql` before using the admin preview API or dashboard.
