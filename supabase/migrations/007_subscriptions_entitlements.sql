-- RepFlow V7: subscriptions and feature entitlements
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'beta' check (plan in ('beta','free','pro','founder')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete','unpaid','paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists subscriptions_customer_idx on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

-- Billing writes happen only through trusted server routes/service role.

create or replace function public.ensure_beta_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions(user_id, plan, status)
  values(new.id, 'beta', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_create_subscription on auth.users;
create trigger on_auth_user_create_subscription
after insert on auth.users
for each row execute procedure public.ensure_beta_subscription();

-- Backfill existing users.
insert into public.subscriptions(user_id, plan, status)
select id, 'beta', 'active' from auth.users
on conflict (user_id) do nothing;
