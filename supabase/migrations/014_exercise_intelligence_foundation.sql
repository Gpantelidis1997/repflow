-- RepFlow V14A: Exercise Intelligence Foundation
alter table public.exercises
  add column if not exists movement_family text,
  add column if not exists force_vector text,
  add column if not exists joint_actions text[] not null default '{}',
  add column if not exists muscle_contributions jsonb not null default '{}'::jsonb,
  add column if not exists smart_tags text[] not null default '{}',
  add column if not exists fatigue_cost smallint not null default 2 check (fatigue_cost between 1 and 5),
  add column if not exists skill_demand smallint not null default 2 check (skill_demand between 1 and 5),
  add column if not exists setup_time_seconds integer not null default 30 check (setup_time_seconds >= 0),
  add column if not exists estimated_set_seconds integer not null default 45 check (estimated_set_seconds > 0),
  add column if not exists duplicate_cluster text,
  add column if not exists contraindication_tags text[] not null default '{}',
  add column if not exists generator_enabled boolean not null default true,
  add column if not exists taxonomy_version text not null default 'taxonomy-v1.0.0';

create table if not exists public.movement_taxonomy (
  key text primary key,
  label text not null,
  parent_key text references public.movement_taxonomy(key) on delete set null,
  body_region text not null,
  description text not null,
  default_session_role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_compatibility (
  source_exercise_id text not null references public.exercises(exercise_id) on delete cascade,
  alternative_exercise_id text not null references public.exercises(exercise_id) on delete cascade,
  compatibility_score smallint not null check (compatibility_score between 0 and 100),
  rationale text not null,
  equipment_match boolean not null default false,
  movement_match boolean not null default false,
  muscle_match boolean not null default false,
  difficulty_delta smallint not null default 0,
  engine_version text not null default 'compatibility-v1.0.0',
  updated_at timestamptz not null default now(),
  primary key(source_exercise_id, alternative_exercise_id),
  check (source_exercise_id <> alternative_exercise_id)
);

create table if not exists public.exercise_quality_flags (
  id uuid primary key default gen_random_uuid(),
  exercise_id text not null references public.exercises(exercise_id) on delete cascade,
  flag_type text not null check(flag_type in ('missing_metadata','invalid_range','duplicate','manual_review')),
  severity text not null check(severity in ('info','warning','critical')),
  message text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists exercises_smart_tags_gin on public.exercises using gin(smart_tags);
create index if not exists exercises_equipment_gin on public.exercises using gin(equipment);
create index if not exists exercises_generator_idx on public.exercises(generator_enabled, active, movement_family);
create index if not exists exercises_duplicate_cluster_idx on public.exercises(duplicate_cluster);
create index if not exists exercise_compatibility_source_score_idx on public.exercise_compatibility(source_exercise_id, compatibility_score desc);

alter table public.movement_taxonomy enable row level security;
alter table public.exercise_compatibility enable row level security;
alter table public.exercise_quality_flags enable row level security;

create policy "authenticated read movement taxonomy" on public.movement_taxonomy for select to authenticated using(true);
create policy "authenticated read compatibility" on public.exercise_compatibility for select to authenticated using(true);
create policy "admins manage movement taxonomy" on public.movement_taxonomy for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin')));
create policy "admins manage compatibility" on public.exercise_compatibility for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin')));
create policy "admins manage quality flags" on public.exercise_quality_flags for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin')));

insert into public.movement_taxonomy(key,label,parent_key,body_region,description,default_session_role) values
('upper_push','Upper Push',null,'Upper','Upper-body pressing patterns.','primary'),
('horizontal_push','Horizontal Push','upper_push','Upper','Pressing mainly perpendicular to the torso.','primary'),
('incline_push','Incline Push','upper_push','Upper','Pressing on an upward diagonal.','secondary'),
('vertical_push','Vertical Push','upper_push','Upper','Pressing overhead.','primary'),
('upper_pull','Upper Pull',null,'Upper','Upper-body pulling patterns.','primary'),
('horizontal_pull','Horizontal Pull','upper_pull','Upper','Pulling toward the torso.','primary'),
('vertical_pull','Upper Pull','upper_pull','Upper','Pulling from overhead.','primary'),
('knee_dominant','Knee Dominant',null,'Lower','Lower-body patterns dominated by knee extension.','primary'),
('hip_hinge','Hip Hinge',null,'Lower','Lower-body patterns dominated by hip extension.','primary'),
('single_leg','Single Leg',null,'Lower','Unilateral lower-body patterns.','secondary'),
('elbow_flexion','Elbow Flexion',null,'Upper','Direct elbow-flexor work.','accessory'),
('elbow_extension','Elbow Extension',null,'Upper','Direct elbow-extensor work.','accessory'),
('shoulder_abduction','Shoulder Abduction',null,'Upper','Direct lateral-deltoid work.','accessory'),
('core_anti_extension','Core Anti-extension',null,'Core','Resist lumbar extension.','accessory'),
('core_anti_rotation','Core Anti-rotation',null,'Core','Resist trunk rotation.','accessory')
on conflict(key) do update set label=excluded.label,parent_key=excluded.parent_key,body_region=excluded.body_region,description=excluded.description,default_session_role=excluded.default_session_role;

update public.exercises set
 movement_family = case
   when movement_pattern ilike '%Horizontal Push%' then 'horizontal_push'
   when movement_pattern ilike '%Incline%' then 'incline_push'
   when movement_pattern ilike '%Vertical Push%' then 'vertical_push'
   when movement_pattern ilike '%Horizontal Pull%' then 'horizontal_pull'
   when movement_pattern ilike '%Vertical Pull%' then 'vertical_pull'
   when movement_pattern ilike '%Squat%' or movement_pattern ilike '%Knee%' then 'knee_dominant'
   when movement_pattern ilike '%Hinge%' or movement_pattern ilike '%Hip Extension%' then 'hip_hinge'
   else lower(replace(movement_pattern,' ','_')) end,
 force_vector = case when movement_pattern ilike '%Horizontal%' then 'horizontal' when movement_pattern ilike '%Vertical%' then 'vertical' else 'mixed' end,
 smart_tags = array_remove(array[lower(replace(movement_pattern,' ','_')), lower(replace(primary_muscle,' ','_')), lower(replace(exercise_role,' ','_')), case when is_unilateral then 'unilateral' else 'bilateral' end], null),
 duplicate_cluster = coalesce(nullif(replacement_group,''), exercise_id),
 generator_enabled = active
where movement_family is null or duplicate_cluster is null;
