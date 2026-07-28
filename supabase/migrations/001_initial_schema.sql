create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null,
  experience text not null,
  days smallint not null check (days between 2 and 5),
  duration text not null,
  equipment text not null,
  priority text not null default 'No Priority',
  status text not null default 'draft' check (status in ('draft','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','active','archived','paused')),
  split text not null,
  program_json jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists one_active_program_per_user on public.programs(user_id) where status='active';

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  workout_name text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed','partial','missed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_minutes integer,
  session_json jsonb not null default '{}'::jsonb
);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id text not null,
  set_number smallint not null,
  load numeric(8,2) not null default 0,
  reps integer not null check (reps >= 0),
  difficulty text check (difficulty in ('Very Easy','Good','Very Hard','Pain')),
  created_at timestamptz not null default now(),
  unique(workout_session_id, exercise_id, set_number)
);

create table if not exists public.progression_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  exercise_id text not null,
  state text not null check (state in ('Calibration','Increase','Build Reps','Repeat','Reduce','Review','Replace')),
  previous_load numeric(8,2),
  next_load numeric(8,2),
  target_text text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email) values(new.id,new.email); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.programs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.progression_records enable row level security;

create policy "profiles own rows" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "assessments own rows" on public.assessments for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "programs own rows" on public.programs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "sessions own rows" on public.workout_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "set logs own rows" on public.set_logs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "progression own rows" on public.progression_records for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
