# RepFlow Autonomous Operations

V12 introduces an exception-only operations layer. The founder does not manage individual members or edit programmes.

## Hourly automation

`GET /api/cron/autonomous-operations` is called by Vercel Cron and authenticated with `CRON_SECRET`.

It:

1. Enqueues deduplicated work.
2. Claims queued jobs safely.
3. Creates in-app billing and inactivity notices.
4. Converts unresolved generator exceptions into operational incidents.
5. Records service health.
6. Retries non-terminal failures with increasing delay.
7. Leaves only terminal failures for founder attention.

## Important boundaries

- Stripe remains the payment source of truth and performs payment retries.
- RepFlow never claims an external email was sent unless an email provider is configured.
- Inactivity reminders respect `user_preferences.inactivity_reminders_enabled`.
- Jobs use deduplication keys to prevent repeated notices.
- No automatic medical, recovery, sleep, nutrition or sport-science decisions are included.

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
STRIPE_SECRET_KEY=
```

Optional:

```bash
EMAIL_PROVIDER_API_KEY=
```

Without an email provider, the system continues through in-app notifications and reports email health as `Unknown`.
