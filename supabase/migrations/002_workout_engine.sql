alter table public.workout_sessions
  add column if not exists workout_index integer,
  add column if not exists workout_mode text not null default 'full'
    check (workout_mode in ('full','short')),
  add column if not exists current_exercise_index integer not null default 0,
  add column if not exists last_synced_at timestamptz not null default now();

alter table public.set_logs
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.exercise_replacements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_session_id uuid references public.workout_sessions(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  original_exercise_id text not null,
  replacement_exercise_id text not null,
  reason text not null check (reason in ('Busy Equipment','Unavailable Equipment','Pain','Dislike','Other')),
  scope text not null check (scope in ('session','program')),
  created_at timestamptz not null default now()
);

alter table public.exercise_replacements enable row level security;
create policy "replacements own rows" on public.exercise_replacements
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create index if not exists workout_sessions_user_status_idx
on public.workout_sessions(user_id,status,started_at desc);
create index if not exists set_logs_session_exercise_idx
on public.set_logs(workout_session_id,exercise_id,set_number);
