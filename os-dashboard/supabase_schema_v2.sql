-- First Class Head Quarters v2 schema (single-user ready, multi-user safe)
create extension if not exists pgcrypto;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due timestamptz,
  priority text not null default 'med',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  streak int not null default 0,
  target int not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  niche text,
  phone text,
  status text not null default 'new', -- new/contacted/booked/closed/lost
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists closes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  amount numeric(10,2) not null default 0,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;
alter table habits enable row level security;
alter table leads enable row level security;
alter table closes enable row level security;

-- tasks policies
drop policy if exists "tasks_select_own" on tasks;
create policy "tasks_select_own" on tasks for select using (auth.uid() = user_id);
drop policy if exists "tasks_insert_own" on tasks;
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = user_id);
drop policy if exists "tasks_update_own" on tasks;
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id);
drop policy if exists "tasks_delete_own" on tasks;
create policy "tasks_delete_own" on tasks for delete using (auth.uid() = user_id);

-- habits policies
drop policy if exists "habits_select_own" on habits;
create policy "habits_select_own" on habits for select using (auth.uid() = user_id);
drop policy if exists "habits_insert_own" on habits;
create policy "habits_insert_own" on habits for insert with check (auth.uid() = user_id);
drop policy if exists "habits_update_own" on habits;
create policy "habits_update_own" on habits for update using (auth.uid() = user_id);
drop policy if exists "habits_delete_own" on habits;
create policy "habits_delete_own" on habits for delete using (auth.uid() = user_id);

-- leads policies
drop policy if exists "leads_select_own" on leads;
create policy "leads_select_own" on leads for select using (auth.uid() = user_id);
drop policy if exists "leads_insert_own" on leads;
create policy "leads_insert_own" on leads for insert with check (auth.uid() = user_id);
drop policy if exists "leads_update_own" on leads;
create policy "leads_update_own" on leads for update using (auth.uid() = user_id);
drop policy if exists "leads_delete_own" on leads;
create policy "leads_delete_own" on leads for delete using (auth.uid() = user_id);

-- closes policies
drop policy if exists "closes_select_own" on closes;
create policy "closes_select_own" on closes for select using (auth.uid() = user_id);
drop policy if exists "closes_insert_own" on closes;
create policy "closes_insert_own" on closes for insert with check (auth.uid() = user_id);
drop policy if exists "closes_update_own" on closes;
create policy "closes_update_own" on closes for update using (auth.uid() = user_id);
drop policy if exists "closes_delete_own" on closes;
create policy "closes_delete_own" on closes for delete using (auth.uid() = user_id);

create index if not exists idx_tasks_user on tasks(user_id);
create index if not exists idx_habits_user on habits(user_id);
create index if not exists idx_leads_user on leads(user_id);
create index if not exists idx_closes_user on closes(user_id);
