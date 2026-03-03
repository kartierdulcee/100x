-- v3 additions for editable KPI + daily check-ins

create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  value numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

alter table kpis enable row level security;
alter table daily_checkins enable row level security;

drop policy if exists "kpis_select_own" on kpis;
create policy "kpis_select_own" on kpis for select using (auth.uid() = user_id);
drop policy if exists "kpis_insert_own" on kpis;
create policy "kpis_insert_own" on kpis for insert with check (auth.uid() = user_id);
drop policy if exists "kpis_update_own" on kpis;
create policy "kpis_update_own" on kpis for update using (auth.uid() = user_id);
drop policy if exists "kpis_delete_own" on kpis;
create policy "kpis_delete_own" on kpis for delete using (auth.uid() = user_id);

drop policy if exists "checkins_select_own" on daily_checkins;
create policy "checkins_select_own" on daily_checkins for select using (auth.uid() = user_id);
drop policy if exists "checkins_insert_own" on daily_checkins;
create policy "checkins_insert_own" on daily_checkins for insert with check (auth.uid() = user_id);
drop policy if exists "checkins_update_own" on daily_checkins;
create policy "checkins_update_own" on daily_checkins for update using (auth.uid() = user_id);
drop policy if exists "checkins_delete_own" on daily_checkins;
create policy "checkins_delete_own" on daily_checkins for delete using (auth.uid() = user_id);

create index if not exists idx_kpis_user on kpis(user_id);
create index if not exists idx_checkins_user on daily_checkins(user_id);
