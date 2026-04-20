-- CRM Schema for 苗林行業務系統
-- Phase 1: Clients + Visit Records + Follow-ups

-- ═══════════════════════════════════════
-- Table: clients
-- ═══════════════════════════════════════
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  address text,
  phone text,
  contact_person text,
  contact_role text,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'inactive')),
  tags text[] default '{}',
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_name_idx on public.clients using gin (to_tsvector('simple', name));
create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_owner_idx on public.clients (owner_id);

-- ═══════════════════════════════════════
-- Table: visits
-- ═══════════════════════════════════════
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  visit_date timestamptz not null default now(),
  visited_by uuid references auth.users(id) on delete set null,
  product_discussed text,
  target_role text,
  outcome text check (outcome in ('positive', 'neutral', 'negative')),
  client_reaction text,
  key_findings text,
  questions_used jsonb,
  next_action text,
  next_follow_up_date date,
  created_at timestamptz not null default now()
);

create index if not exists visits_client_idx on public.visits (client_id, visit_date desc);
create index if not exists visits_visitor_idx on public.visits (visited_by);

-- ═══════════════════════════════════════
-- Table: follow_ups
-- ═══════════════════════════════════════
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete cascade,
  action text not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'done', 'overdue')),
  assigned_to uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists follow_ups_status_idx on public.follow_ups (status, due_date);
create index if not exists follow_ups_client_idx on public.follow_ups (client_id);
create index if not exists follow_ups_assignee_idx on public.follow_ups (assigned_to);

-- ═══════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute procedure public.touch_updated_at();

-- Auto-mark overdue follow-ups
create or replace function public.mark_overdue_follow_ups()
returns void language sql as $$
  update public.follow_ups
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;
$$;

-- ═══════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════
alter table public.clients enable row level security;
alter table public.visits enable row level security;
alter table public.follow_ups enable row level security;

-- Clients: owner can CRUD, everyone can read (shared team view)
drop policy if exists "clients read all" on public.clients;
create policy "clients read all" on public.clients
  for select using (auth.uid() is not null);

drop policy if exists "clients insert own" on public.clients;
create policy "clients insert own" on public.clients
  for insert with check (auth.uid() is not null);

drop policy if exists "clients update own" on public.clients;
create policy "clients update own" on public.clients
  for update using (owner_id = auth.uid() or owner_id is null);

drop policy if exists "clients delete own" on public.clients;
create policy "clients delete own" on public.clients
  for delete using (owner_id = auth.uid());

-- Visits: visible to all authenticated, editable by visitor
drop policy if exists "visits read all" on public.visits;
create policy "visits read all" on public.visits
  for select using (auth.uid() is not null);

drop policy if exists "visits insert own" on public.visits;
create policy "visits insert own" on public.visits
  for insert with check (auth.uid() is not null);

drop policy if exists "visits update own" on public.visits;
create policy "visits update own" on public.visits
  for update using (visited_by = auth.uid() or visited_by is null);

drop policy if exists "visits delete own" on public.visits;
create policy "visits delete own" on public.visits
  for delete using (visited_by = auth.uid());

-- Follow-ups: visible to all authenticated, editable by assignee
drop policy if exists "follow_ups read all" on public.follow_ups;
create policy "follow_ups read all" on public.follow_ups
  for select using (auth.uid() is not null);

drop policy if exists "follow_ups insert own" on public.follow_ups;
create policy "follow_ups insert own" on public.follow_ups
  for insert with check (auth.uid() is not null);

drop policy if exists "follow_ups update own" on public.follow_ups;
create policy "follow_ups update own" on public.follow_ups
  for update using (assigned_to = auth.uid() or assigned_to is null);

drop policy if exists "follow_ups delete own" on public.follow_ups;
create policy "follow_ups delete own" on public.follow_ups
  for delete using (assigned_to = auth.uid());
