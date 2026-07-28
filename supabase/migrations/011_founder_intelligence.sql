-- RepFlow V11: low-maintenance founder dashboard and intelligence centre
create table if not exists public.business_daily_snapshots (
  snapshot_date date primary key,
  active_subscribers integer not null default 0,
  trialing_subscribers integer not null default 0,
  past_due_subscribers integer not null default 0,
  canceled_subscribers integer not null default 0,
  new_users integer not null default 0,
  completed_workouts integer not null default 0,
  generated_programs integer not null default 0,
  failed_billing_events integer not null default 0,
  estimated_mrr_cents integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);

create table if not exists public.intelligence_insights (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('business','billing','product','generator','system')),
  severity text not null default 'info' check (severity in ('info','opportunity','warning','critical')),
  title text not null,
  body text not null,
  metric_key text,
  metric_value numeric,
  recommendation text,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  fingerprint text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique(fingerprint, status)
);

create table if not exists public.system_health_checks (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  status text not null check (status in ('healthy','degraded','down','unknown')),
  latency_ms integer,
  detail text,
  checked_at timestamptz not null default now()
);

create index if not exists intelligence_open_idx on public.intelligence_insights(status, severity, last_seen_at desc);
create index if not exists health_service_checked_idx on public.system_health_checks(service, checked_at desc);

alter table public.business_daily_snapshots enable row level security;
alter table public.intelligence_insights enable row level security;
alter table public.system_health_checks enable row level security;

create policy "admins read business snapshots" on public.business_daily_snapshots for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read intelligence" on public.intelligence_insights for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins update intelligence" on public.intelligence_insights for update using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read health" on public.system_health_checks for select using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
);

create or replace function public.refresh_founder_snapshot(target_date date default current_date)
returns public.business_daily_snapshots
language plpgsql
security definer set search_path = public
as $$
declare result public.business_daily_snapshots;
begin
  insert into public.business_daily_snapshots(
    snapshot_date, active_subscribers, trialing_subscribers, past_due_subscribers,
    canceled_subscribers, new_users, completed_workouts, generated_programs,
    failed_billing_events, estimated_mrr_cents, calculated_at
  )
  select
    target_date,
    count(*) filter (where s.status = 'active'),
    count(*) filter (where s.status = 'trialing'),
    count(*) filter (where s.status in ('past_due','unpaid','incomplete')),
    count(*) filter (where s.status = 'canceled'),
    (select count(*) from public.profiles p where p.created_at >= target_date and p.created_at < target_date + 1),
    (select count(*) from public.workout_sessions w where w.completed_at >= target_date and w.completed_at < target_date + 1),
    (select count(*) from public.programs pr where pr.created_at >= target_date and pr.created_at < target_date + 1),
    (select count(*) from public.billing_events b where b.processed_at >= target_date and b.processed_at < target_date + 1 and b.event_type like 'invoice.payment_failed%'),
    coalesce(sum(case s.plan when 'pro' then 999 when 'founder' then 699 else 0 end) filter (where s.status in ('active','trialing')),0)::integer,
    now()
  from public.subscriptions s
  on conflict (snapshot_date) do update set
    active_subscribers = excluded.active_subscribers,
    trialing_subscribers = excluded.trialing_subscribers,
    past_due_subscribers = excluded.past_due_subscribers,
    canceled_subscribers = excluded.canceled_subscribers,
    new_users = excluded.new_users,
    completed_workouts = excluded.completed_workouts,
    generated_programs = excluded.generated_programs,
    failed_billing_events = excluded.failed_billing_events,
    estimated_mrr_cents = excluded.estimated_mrr_cents,
    calculated_at = now()
  returning * into result;

  if result.past_due_subscribers > 0 then
    insert into public.intelligence_insights(category,severity,title,body,metric_key,metric_value,recommendation,fingerprint)
    values('billing','warning','Payments need attention', result.past_due_subscribers || ' subscriptions are past due or unpaid.','past_due_subscribers',result.past_due_subscribers,'Stripe retries should run automatically; investigate only if this remains elevated.','billing-past-due-' || target_date)
    on conflict (fingerprint,status) do update set last_seen_at=now(),metric_value=excluded.metric_value,body=excluded.body;
  end if;

  return result;
end;
$$;

revoke all on function public.refresh_founder_snapshot(date) from public;
grant execute on function public.refresh_founder_snapshot(date) to service_role;
