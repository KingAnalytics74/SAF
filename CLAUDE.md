# Saf — project brief for Claude Code

AI-powered rota and staffing platform for care providers. First client: Gracewood Healthcare.

## Stack decisions
- Frontend: Next.js (App Router) + React + Tailwind
- Backend: Next.js API routes to start (split into a separate FastAPI service later only if the risk engine needs Python-specific ML tooling)
- Database: Postgres via Supabase (gives realtime + auth + Postgres in one, avoids building auth from scratch)
- Deploy target: Vercel (frontend/API) + Supabase (DB)

## Reference prototype
There's a working HTML/JS prototype (`saf-prototype.html`) demonstrating the intended interaction model: dashboard with fatigue-colored shifts, open-shift fill with gender-rule validation, rota grid with click-through detail, swap approval flow, and a role-gated audit log with per-entry investigation assignment. Treat it as the UX spec — rebuild this exact interaction model against real data, don't redesign from scratch.

## Core entities
- `staff` — role, gender, certifications, contracted hours
- `clients` — address, care needs, gender_requirement, is_minor
- `shift_groups` — one unit of cover; any staff_count:client_count combination
- `shift_group_staff`, `shift_group_clients` — join tables
- `staffing_requirements` — required staff:client ratio per client, per time slot
- `shift_change_log` — audit trail: who, role, action, timestamp
- `swap_requests` — staff-raised, coordinator/manager-approved

## Draft schema (starting point, refine as needed)

```sql
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null check (gender in ('M','F')),
  role text not null check (role in ('staff','care_coordinator','manager')),
  contracted_hours int,
  certifications text[]
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gender_requirement text check (gender_requirement in ('M','F', null)),
  is_minor boolean default false,
  care_needs text
);

create table shift_groups (
  id uuid primary key default gen_random_uuid(),
  shift_type text not null check (shift_type in ('day','sleep_in','waking_night')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'open' check (status in ('open','filled','cancelled'))
);

create table shift_group_staff (
  shift_group_id uuid references shift_groups(id),
  staff_id uuid references staff(id),
  primary key (shift_group_id, staff_id)
);

create table shift_group_clients (
  shift_group_id uuid references shift_groups(id),
  client_id uuid references clients(id),
  primary key (shift_group_id, client_id)
);

create table staffing_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  time_slot tstzrange not null,
  required_staff_count int not null
);

create table shift_change_log (
  id uuid primary key default gen_random_uuid(),
  shift_group_id uuid references shift_groups(id),
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
  shift_group_id uuid references shift_groups(id),
  from_staff_id uuid references staff(id),
  to_staff_id uuid references staff(id),
  reason text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz default now(),
  decided_by uuid references staff(id),
  decided_at timestamptz
);
```

## Business rules to enforce server-side (not just UI)

1. **Gender matching** — for each client in a shift group, at least one assigned staff must match `client.gender_requirement` (if set).
2. **Pairing rule** — if 2+ staff cover one client, block the assignment only if *all* assigned staff are the opposite gender to that client.
3. **Swap approval** — `swap_requests` only move a shift's staffing on `status = 'approved'`; staff can never write directly to `shift_group_staff`.
4. **Audit log visibility** — `shift_change_log` reads are restricted to `role = 'manager'` (and `care_coordinator` if you decide to extend it — currently scoped to manager only per the prototype).
5. **Fatigue scoring** — rules-based, computed from `shift_change_log` + `shift_groups` history: rest since last shift, consecutive days, weekly hours vs. contracted cap. Runs as a derived query/view, not stored state, so it's always current.

## Phase 1 (MVP) task breakdown
1. Scaffold Next.js app + Supabase project, apply schema above
2. Auth + role-based access (staff / care_coordinator / manager)
3. Rota view — read shift_groups + assignments, render grid
4. Real-time staffing dashboard — required vs. assigned per client/slot
5. Open-shift fill flow with gender/pairing validation (server-side)
6. Fatigue badge calculation (rules-based) surfaced on shift rows
7. Swap request flow: raise → pending → approve/reject → shift_change_log entry
8. Audit log view, manager-only, with investigation assignment field

## Not yet decided (flag if it comes up)
- Minor-client safeguarding rules beyond `is_minor` flag (DBS level, lone-working restrictions)
- Whether care_coordinator gets any audit log visibility, or manager-only stays permanent

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
