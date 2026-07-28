-- RepFlow V9: reliability, audit and operational controls
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_account_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','restricted','suspended')),
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  route_key text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique(route_key, subject_hash, window_started_at)
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists audit_logs_target_idx on public.audit_logs(target_user_id, created_at desc);
create index if not exists rate_limit_route_window_idx on public.rate_limit_events(route_key, window_started_at desc);

alter table public.audit_logs enable row level security;
alter table public.user_account_status enable row level security;
alter table public.rate_limit_events enable row level security;

create policy "admins read audit logs" on public.audit_logs for select using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read account status" on public.user_account_status for select using (
  user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins manage account status" on public.user_account_status for all using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
) with check (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
);
create policy "admins read rate events" on public.rate_limit_events for select using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
);

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into public.audit_logs(actor_user_id,target_user_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),p_target_user_id,p_action,p_entity_type,p_entity_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.write_audit_log(text,text,text,uuid,jsonb) to authenticated;
