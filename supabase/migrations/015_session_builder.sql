-- RepFlow V14B: deterministic session builder and generation audit trail
create table if not exists public.session_generation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'admin_preview',
  constraints jsonb not null,
  result jsonb not null,
  overall_score numeric(5,2) not null,
  estimated_minutes integer not null,
  publishable boolean not null default false,
  engine_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists session_generation_runs_created_at_idx on public.session_generation_runs(created_at desc);
create index if not exists session_generation_runs_publishable_idx on public.session_generation_runs(publishable, created_at desc);

alter table public.session_generation_runs enable row level security;

create policy "admins read session generation runs"
on public.session_generation_runs for select
to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

comment on table public.session_generation_runs is 'Immutable audit trail for deterministic V14B session generation attempts.';
