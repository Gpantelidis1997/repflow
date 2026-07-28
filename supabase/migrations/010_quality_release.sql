-- RepFlow V10: release quality and deployment traceability

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  release_id text not null unique,
  commit_sha text,
  environment text not null default 'production' check (environment in ('preview', 'staging', 'production')),
  status text not null default 'deployed' check (status in ('deployed', 'verified', 'failed', 'rolled_back')),
  smoke_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_releases_created_at_idx on public.app_releases(created_at desc);
create index if not exists app_releases_environment_status_idx on public.app_releases(environment, status);

alter table public.app_releases enable row level security;

create policy "admins can read releases"
on public.app_releases for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  )
);

create or replace function public.mark_release_verified(p_release_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  ) then
    raise exception 'not authorized';
  end if;

  update public.app_releases
  set status = 'verified', smoke_checked_at = now()
  where release_id = p_release_id;
end;
$$;
