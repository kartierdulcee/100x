-- Run in Supabase SQL editor
create extension if not exists pgcrypto;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due timestamptz null,
  priority text not null default 'med',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  streak int not null default 0,
  target int not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists trading_logs (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  compliance int not null,
  created_at timestamptz not null default now()
);

create table if not exists outreach_logs (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  sent int not null,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;
alter table habits enable row level security;
alter table trading_logs enable row level security;
alter table outreach_logs enable row level security;

-- NOTE: permissive anon policies for single-user private dashboard.
-- Tighten with auth policies later.
drop policy if exists "anon full access tasks" on tasks;
create policy "anon full access tasks" on tasks for all using (true) with check (true);

drop policy if exists "anon full access habits" on habits;
create policy "anon full access habits" on habits for all using (true) with check (true);

drop policy if exists "anon full access trading" on trading_logs;
create policy "anon full access trading" on trading_logs for all using (true) with check (true);

drop policy if exists "anon full access outreach" on outreach_logs;
create policy "anon full access outreach" on outreach_logs for all using (true) with check (true);
