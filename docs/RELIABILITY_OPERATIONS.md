# RepFlow Reliability & Operations

## Scope
V9 adds an audit trail, account operational status, admin exports, rate-limit event storage and an operations centre.

## Security boundaries
- Never store passwords, session tokens, Stripe secrets or Supabase service keys in audit metadata.
- Prefer identifiers and small structured metadata.
- Operational suspension is distinct from deleting a Supabase Auth user.
- Admin CSV exports exclude workout set logs by default.

## Backup plan
1. Enable Supabase automated backups for production.
2. Confirm the recovery window for the selected Supabase plan.
3. Test restoration in a separate project before launch.
4. Export audit and user-operation data before major migrations.
5. Record every emergency change in `audit_logs`.

## Rate limiting
`rate_limit_events` is a persistence layer for an external or middleware limiter. Use a managed edge limiter in production; do not rely on a single in-memory counter across serverless instances.

## Incident checklist
1. Confirm scope and affected users.
2. Restrict compromised accounts without deleting workout history.
3. Rotate exposed secrets.
4. Review audit events and Stripe webhook deliveries.
5. Restore from a verified backup if data integrity is affected.
6. Document remediation and notify users when legally required.
