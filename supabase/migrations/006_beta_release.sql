-- RepFlow V6: beta invitations and release controls
create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  email text,
  status text not null default 'active' check (status in ('active','used','revoked')),
  expires_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists beta_invites_status_idx on public.beta_invites(status);
create index if not exists beta_invites_email_idx on public.beta_invites(lower(email));
alter table public.beta_invites enable row level security;

drop policy if exists "admins manage beta invites" on public.beta_invites;
create policy "admins manage beta invites" on public.beta_invites for all using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
) with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','super_admin'))
);

create or replace function public.validate_beta_invite(invite_code text, invite_email text)
returns boolean language sql security definer set search_path=public as $$
 select exists(
   select 1 from public.beta_invites
   where code=invite_code and status='active'
     and (expires_at is null or expires_at>now())
     and (email is null or lower(email)=lower(invite_email))
 );
$$;
revoke all on function public.validate_beta_invite(text,text) from public;
grant execute on function public.validate_beta_invite(text,text) to service_role;
