create table if not exists public.pain_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  exercise_id text,
  body_area text,
  intensity text check (intensity in ('Mild','Moderate','Severe')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.pain_logs enable row level security;
create policy "pain logs own rows" on public.pain_logs
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists pain_logs_user_created_idx on public.pain_logs(user_id,created_at desc);

create or replace function public.seed_workout_sequence(target_program_id uuid)
returns integer
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.programs;
  item jsonb;
  idx integer := 0;
begin
  select * into p from public.programs where id=target_program_id and user_id=auth.uid();
  if p.id is null then raise exception 'Program not found'; end if;
  delete from public.workout_schedule_events where user_id=auth.uid() and program_id=target_program_id and status='scheduled';
  for item in select * from jsonb_array_elements(p.program_json->'workouts') loop
    insert into public.workout_schedule_events(user_id,program_id,workout_name,sequence_index,status)
    values(auth.uid(),target_program_id,item->>'name',idx,'scheduled');
    idx := idx + 1;
  end loop;
  return idx;
end;
$$;
