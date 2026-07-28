-- RepFlow V8: retention, lifecycle notifications and referral-ready growth hooks
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_summary_enabled boolean not null default true,
  inactivity_reminders_enabled boolean not null default true,
  product_updates_enabled boolean not null default true,
  preferred_weekly_summary_day smallint not null default 1 check (preferred_weekly_summary_day between 0 and 6),
  timezone text not null default 'Europe/Stockholm',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('onboarding','weekly_summary','inactivity','progress','billing','system')),
  title text not null,
  body text not null,
  action_label text,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique,
  status text not null default 'active' check (status in ('active','paused','disabled')),
  successful_referrals integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','activated','qualified','rewarded','invalid')),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists notifications_expiry_idx on public.notifications(expires_at) where expires_at is not null;
create index if not exists referral_attributions_code_idx on public.referral_attributions(referral_code_id, status);

alter table public.user_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;

create policy "users manage own preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own referral code" on public.referral_codes for select using (auth.uid() = owner_user_id);
create policy "users create own referral code" on public.referral_codes for insert with check (auth.uid() = owner_user_id);
create policy "users read own referral attributions" on public.referral_attributions for select using (
  exists(select 1 from public.referral_codes rc where rc.id = referral_code_id and rc.owner_user_id = auth.uid())
);

create or replace function public.ensure_user_lifecycle_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_preferences(user_id) values(new.id) on conflict (user_id) do nothing;
  insert into public.referral_codes(owner_user_id, code)
  values(new.id, upper(substr(replace(new.id::text, '-', ''), 1, 8)))
  on conflict (owner_user_id) do nothing;
  insert into public.notifications(user_id,type,title,body,action_label,action_url)
  values(new.id,'onboarding','Welcome to RepFlow','Complete your assessment to generate your first evidence-based programme.','Start assessment','/assessment');
  return new;
end; $$;

drop trigger if exists on_auth_user_lifecycle_defaults on auth.users;
create trigger on_auth_user_lifecycle_defaults after insert on auth.users for each row execute function public.ensure_user_lifecycle_defaults();

insert into public.user_preferences(user_id)
select id from auth.users on conflict (user_id) do nothing;
insert into public.referral_codes(owner_user_id, code)
select id, upper(substr(replace(id::text, '-', ''), 1, 8)) from auth.users on conflict (owner_user_id) do nothing;
