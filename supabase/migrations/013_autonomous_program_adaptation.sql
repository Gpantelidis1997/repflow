create table if not exists public.adaptation_policies (
  key text primary key,
  name text not null,
  description text not null,
  enabled boolean not null default true,
  min_confidence numeric(4,3) not null default 0.80 check (min_confidence between 0 and 1),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.adaptation_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  exercise_id text,
  decision_type text not null check (decision_type in ('increase_load','build_reps','repeat','reduce_load','replace_exercise','regenerate_program','manual_review')),
  status text not null default 'proposed' check (status in ('proposed','applied','rejected','rolled_back','review_required')),
  reason_code text not null,
  explanation text not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  previous_state jsonb not null default '{}'::jsonb,
  next_state jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  engine_version text not null default 'adaptation-v1.0.0',
  dedupe_key text not null unique,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.adaptation_rollbacks (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.adaptation_decisions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  restored_state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists adaptation_decisions_user_created_idx on public.adaptation_decisions(user_id, created_at desc);
create index if not exists adaptation_decisions_status_idx on public.adaptation_decisions(status, created_at desc);

alter table public.adaptation_policies enable row level security;
alter table public.adaptation_decisions enable row level security;
alter table public.adaptation_rollbacks enable row level security;

create policy "users read own adaptation decisions" on public.adaptation_decisions for select using (auth.uid() = user_id);
create policy "users read own adaptation rollbacks" on public.adaptation_rollbacks for select using (auth.uid() = user_id);

insert into public.adaptation_policies(key,name,description,min_confidence,config) values
('load_progression','Load progression','Adjust load or rep targets from completed set logs.',0.80,'{"max_increase_percent":10,"max_reduction_percent":10}'::jsonb),
('pain_guardrail','Pain guardrail','Never increase load after a pain report; require review or replacement.',1.00,'{}'::jsonb),
('exercise_replacement','Exercise replacement','Allow same-pattern replacement only after explicit pain or repeated user replacement.',0.90,'{"replacement_threshold":2}'::jsonb),
('program_regeneration','Program regeneration','Regenerate only after material assessment changes or repeated substitutions.',0.95,'{"replacement_threshold":4,"long_break_days":42}'::jsonb)
on conflict (key) do update set name=excluded.name, description=excluded.description, min_confidence=excluded.min_confidence, config=excluded.config, updated_at=now();
