-- medical reports schema and policies

-- 1) ENUM for status
do $$ begin
  create type report_status as enum ('Pending', 'Processed', 'Error');
exception when duplicate_object then null; end $$;

-- 2) medical_reports table
create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.care_recipients(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_path text,
  external_url text,
  status report_status not null default 'Pending',
  summary_text text,
  summary_json jsonb,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medical_reports_owner on public.medical_reports(owner_id);
create index if not exists idx_medical_reports_patient on public.medical_reports(patient_id);
create index if not exists idx_medical_reports_status on public.medical_reports(status);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_reports_updated on public.medical_reports;
create trigger trg_reports_updated
before update on public.medical_reports
for each row execute function public.set_updated_at();

-- RLS
alter table public.medical_reports enable row level security;

do $$ begin
  create policy own_reports_select on public.medical_reports
  for select using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy own_reports_insert on public.medical_reports
  for insert with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy own_reports_update on public.medical_reports
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy own_reports_delete on public.medical_reports
  for delete using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

-- 3) medical_report_queries table
create table if not exists public.medical_report_queries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.care_recipients(id) on delete cascade,
  question text not null,
  answer text,
  sources jsonb,
  created_at timestamptz not null default now()
);

alter table public.medical_report_queries enable row level security;

do $$ begin
  create policy own_queries_select on public.medical_report_queries
  for select using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy own_queries_insert on public.medical_report_queries
  for insert with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy own_queries_update on public.medical_report_queries
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;


