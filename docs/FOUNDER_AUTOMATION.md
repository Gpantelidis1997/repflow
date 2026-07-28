# Founder Automation

RepFlow V11 is designed to minimize routine owner work.

## What is automatic

- Stripe handles recurring billing and configured payment retries.
- The daily Vercel cron refreshes the founder snapshot.
- Database health is recorded when the snapshot job runs.
- Open insights appear only when a rule identifies an exception.

## What the founder checks

Open `/app/admin/intelligence` and review:

1. Estimated MRR and active subscribers.
2. Payment health.
3. Open intelligence exceptions.
4. Core service health.

No athlete-by-athlete supervision is required.

## Setup

Apply migration `011_founder_intelligence.sql`, then configure:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

Vercel calls `/api/cron/founder-snapshot` daily. For another scheduler, send:

```text
Authorization: Bearer <CRON_SECRET>
```

## Important boundary

Estimated MRR uses the provisional plan values encoded in the migration (€9.99 Pro and €6.99 Founder). Replace these values with the final Stripe price mapping before public launch. Stripe remains the source of truth for actual collected revenue.
