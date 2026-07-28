# RepFlow Beta Release Checklist

## Required before deployment
- [ ] Run migrations 001–006 in order.
- [ ] Configure Supabase production URL and anon key.
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- [ ] Add production URL and callback URL in Supabase Auth settings.
- [ ] Enable email verification and configure sender branding.
- [ ] Decide `NEXT_PUBLIC_BETA_MODE=open` or `invite`.
- [ ] Create the first admin account and verify admin routes.
- [ ] Run `npm run typecheck`, `npm test`, and `npm run build`.
- [ ] Test signup, verification, login, password reset and logout.
- [ ] Complete assessment → programme → workout → next target flow.
- [ ] Test refresh recovery and offline set logging.
- [ ] Test RLS using two separate user accounts.
- [ ] Review Privacy Policy and Terms with qualified counsel.
- [ ] Configure backups, error monitoring and support contact.
- [ ] Verify `/api/health` returns status `ok` after deployment.

## Beta launch gates
- Zero critical authentication defects.
- Zero known cross-user data-access defects.
- Programme generator produces valid plans for all supported assessment combinations.
- Workout logging does not lose completed sets after refresh.
- Monthly review and permanent replacement preserve history.
