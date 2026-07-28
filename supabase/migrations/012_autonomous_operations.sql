-- RepFlow V12: autonomous operations and exception-only founder workflow
create table if not exists public.automation_rules (
  key text primary key,
  name text not null,
  description text not null,
  enabled boolean not null default true,
  cadence text not null default 'daily' check (cadence in ('hourly','daily','weekly','event')),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null references public.automation_rules(key) on delete restrict,
  user_id uuid references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('billing_notice','inactivity_nudge','generator_exception','health_check','snapshot_refresh')),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','skipped')),
  run_after timestamptz not null default now(),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'cron',
  status text not null check (status in ('running','completed','partial','failed')),
  queued_count integer not null default 0,
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,
  detail jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  severity text not null check (severity in ('warning','critical')),
  title text not null,
  detail text not null,
  status text not null default 'open' check (status in ('open','monitoring','resolved')),
  fingerprint text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists automation_jobs_queue_idx on public.automation_jobs(status, run_after, created_at);
create index if not exists automation_runs_started_idx on public.automation_runs(started_at desc);
create index if not exists operational_incidents_status_idx on public.operational_incidents(status, severity, last_seen_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_jobs enable row level security;
alter table public.automation_runs enable row level security;
alter table public.operational_incidents enable row level security;

create policy "admins read automation rules" on public.automation_rules for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read automation jobs" on public.automation_jobs for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read automation runs" on public.automation_runs for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read incidents" on public.operational_incidents for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);

insert into public.automation_rules(key,name,description,cadence,config) values
  ('billing-recovery','Billing recovery','Notify members when Stripe reports a payment problem; Stripe remains responsible for retries.','daily','{"cooldown_days":3}'::jsonb),
  ('inactivity-restart','Inactivity restart','Send one low-pressure restart reminder after a prolonged period without a completed workout.','daily','{"inactive_days":14,"cooldown_days":14}'::jsonb),
  ('generator-exceptions','Generator exceptions','Surface only unresolved generator failures to the founder dashboard.','hourly','{"lookback_hours":24}'::jsonb),
  ('platform-health','Platform health','Check core configuration and database availability.','hourly','{}'::jsonb),
  ('founder-snapshot','Founder snapshot','Refresh the daily business snapshot.','daily','{}'::jsonb)
on conflict (key) do update set name=excluded.name,description=excluded.description,cadence=excluded.cadence,config=excluded.config,updated_at=now();

create or replace function public.enqueue_autonomous_operations(target_date date default current_date)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  queued integer := 0;
  added integer := 0;
begin
  insert into public.automation_jobs(rule_key,user_id,job_type,dedupe_key,payload)
  select 'billing-recovery', s.user_id, 'billing_notice',
         'billing-notice:' || s.user_id || ':' || target_date,
         jsonb_build_object('subscription_status',s.status,'plan',s.plan)
  from public.subscriptions s
  join public.automation_rules r on r.key='billing-recovery' and r.enabled
  where s.status in ('past_due','unpaid','incomplete')
  on conflict (dedupe_key) do nothing;
  get diagnostics added = row_count;
  queued := queued + added;

  insert into public.automation_jobs(rule_key,user_id,job_type,dedupe_key,payload)
  select 'inactivity-restart', p.id, 'inactivity_nudge',
         'inactivity-nudge:' || p.id || ':' || to_char(target_date,'IYYY-IW'),
         jsonb_build_object('inactive_days',14)
  from public.profiles p
  join public.automation_rules r on r.key='inactivity-restart' and r.enabled
  left join lateral (
    select max(ws.completed_at) as last_completed_at
    from public.workout_sessions ws where ws.user_id=p.id
  ) last_session on true
  where coalesce(last_session.last_completed_at,p.created_at) < now() - interval '14 days'
    and exists(select 1 from public.subscriptions s where s.user_id=p.id and s.status in ('active','trialing'))
  on conflict (dedupe_key) do nothing;
  get diagnostics added = row_count;
  queued := queued + added;

  insert into public.automation_jobs(rule_key,job_type,dedupe_key,payload)
  select 'generator-exceptions','generator_exception',
         'generator-exception:' || i.id,
         jsonb_build_object('insight_id',i.id,'title',i.title,'body',i.body)
  from public.intelligence_insights i
  join public.automation_rules r on r.key='generator-exceptions' and r.enabled
  where i.category='generator' and i.status='open' and i.severity in ('warning','critical')
  on conflict (dedupe_key) do nothing;
  get diagnostics added = row_count;
  queued := queued + added;

  insert into public.automation_jobs(rule_key,job_type,dedupe_key)
  select 'platform-health','health_check','health-check:' || to_char(date_trunc('hour',now()),'YYYYMMDDHH24')
  from public.automation_rules where key='platform-health' and enabled
  on conflict (dedupe_key) do nothing;
  get diagnostics added = row_count;
  queued := queued + added;

  return queued;
end;
$$;

revoke all on function public.enqueue_autonomous_operations(date) from public;
grant execute on function public.enqueue_autonomous_operations(date) to service_role;
