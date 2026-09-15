-- Saf core schema: staff, clients, shift groups, staffing requirements,
-- audit trail, and swap requests. See CLAUDE.md for the business rules
-- these tables and policies exist to enforce.

create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  gender text not null check (gender in ('M','F')),
  role text not null check (role in ('staff','care_coordinator','manager')),
  contracted_hours int,
  certifications text[],
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gender_requirement text check (gender_requirement in ('M','F', null)),
  is_minor boolean default false,
  care_needs text,
  created_at timestamptz default now()
);

create table shift_groups (
  id uuid primary key default gen_random_uuid(),
  shift_type text not null check (shift_type in ('day','sleep_in','waking_night')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'open' check (status in ('open','filled','cancelled')),
  created_at timestamptz default now()
);

create table shift_group_staff (
  shift_group_id uuid references shift_groups(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  primary key (shift_group_id, staff_id)
);

create table shift_group_clients (
  shift_group_id uuid references shift_groups(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  primary key (shift_group_id, client_id)
);

create table staffing_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  time_slot tstzrange not null,
  required_staff_count int not null
);

create table shift_change_log (
  id uuid primary key default gen_random_uuid(),
  shift_group_id uuid references shift_groups(id) on delete cascade,
  changed_by uuid references staff(id),
  actor_role text not null,
  action text not null check (action in ('created','reassigned','cancelled','swap_requested','swap_approved','swap_rejected','assigned_investigation')),
  previous_staff_id uuid references staff(id),
  new_staff_id uuid references staff(id),
  reason text,
  created_at timestamptz default now()
);

create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  shift_group_id uuid references shift_groups(id) on delete cascade,
  from_staff_id uuid references staff(id),
  to_staff_id uuid references staff(id),
  reason text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz default now(),
  decided_by uuid references staff(id),
  decided_at timestamptz
);

-- Role lookup for the currently authenticated user, used by RLS policies below.
create function current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from staff where auth_user_id = auth.uid();
$$;

alter table staff enable row level security;
alter table clients enable row level security;
alter table shift_groups enable row level security;
alter table shift_group_staff enable row level security;
alter table shift_group_clients enable row level security;
alter table staffing_requirements enable row level security;
alter table shift_change_log enable row level security;
alter table swap_requests enable row level security;

-- Rota, staffing and client data is readable by any authenticated staff member.
create policy "staff can read staff" on staff for select to authenticated using (true);
create policy "staff can read clients" on clients for select to authenticated using (true);
create policy "staff can read shift_groups" on shift_groups for select to authenticated using (true);
create policy "staff can read shift_group_staff" on shift_group_staff for select to authenticated using (true);
create policy "staff can read shift_group_clients" on shift_group_clients for select to authenticated using (true);
create policy "staff can read staffing_requirements" on staffing_requirements for select to authenticated using (true);

-- Rule: staff can never write directly to shift_group_staff. Only server-side
-- code using the service role (e.g. on swap approval) may write assignments,
-- so no insert/update/delete policies are granted here.

-- Rule: shift_change_log reads are restricted to managers.
create policy "managers can read shift_change_log" on shift_change_log for select to authenticated
  using (current_staff_role() = 'manager');

-- Swap requests: any staff member can raise one for themselves; only
-- coordinators/managers decide, which happens server-side via service role.
create policy "staff can read swap_requests" on swap_requests for select to authenticated using (true);
create policy "staff can raise own swap_requests" on swap_requests for insert to authenticated
  with check (
    from_staff_id in (select id from staff where auth_user_id = auth.uid())
  );
