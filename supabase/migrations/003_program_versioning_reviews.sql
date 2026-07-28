create table if not exists public.program_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  version integer not null,
  reason text not null,
  program_json jsonb not null,
  created_at timestamptz not null default now(),
  unique(program_id, version)
);

create table if not exists public.program_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  review_period_start date not null,
  review_period_end date not null,
  adherence_percent numeric(5,2) not null default 0,
  pain_events integer not null default 0,
  progressing_exercise_percent numeric(5,2) not null default 0,
  replacement_count integer not null default 0,
  recommendation text not null check (recommendation in (
    'Continue','Minor Adjustment','Volume Reduction','Exercise Replacement','Frequency Change','New Program'
  )),
  reasons jsonb not null default '[]'::jsonb,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_schedule_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  workout_name text not null,
  sequence_index integer not null,
  scheduled_for date,
  status text not null default 'scheduled' check (status in ('scheduled','completed','partial','missed','skipped')),
  reason text,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.programs
  add column if not exists parent_program_id uuid references public.programs(id) on delete set null,
  add column if not exists change_reason text,
  add column if not exists activated_at timestamptz;

alter table public.program_versions enable row level security;
alter table public.program_reviews enable row level security;
alter table public.workout_schedule_events enable row level security;

create policy "program versions own rows" on public.program_versions
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "program reviews own rows" on public.program_reviews
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "schedule events own rows" on public.workout_schedule_events
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create index if not exists program_versions_program_idx on public.program_versions(program_id,version desc);
create index if not exists program_reviews_user_idx on public.program_reviews(user_id,created_at desc);
create index if not exists workout_schedule_sequence_idx on public.workout_schedule_events(user_id,program_id,sequence_index);

create or replace function public.create_program_version(
  target_program_id uuid,
  next_program_json jsonb,
  version_reason text
) returns public.programs
language plpgsql
security invoker
set search_path=public
as $$
declare
  current_program public.programs;
  next_program public.programs;
begin
  select * into current_program from public.programs
  where id=target_program_id and user_id=auth.uid() and status='active'
  for update;

  if current_program.id is null then
    raise exception 'Active program not found';
  end if;

  insert into public.program_versions(user_id,program_id,version,reason,program_json)
  values(current_program.user_id,current_program.id,current_program.version,coalesce(current_program.change_reason,'Initial Version'),current_program.program_json)
  on conflict(program_id,version) do nothing;

  update public.programs set status='archived' where id=current_program.id;

  insert into public.programs(
    user_id,assessment_id,status,split,program_json,version,parent_program_id,change_reason,activated_at
  ) values(
    current_program.user_id,current_program.assessment_id,'active',current_program.split,next_program_json,
    current_program.version+1,current_program.id,version_reason,now()
  ) returning * into next_program;

  return next_program;
end;
$$;
