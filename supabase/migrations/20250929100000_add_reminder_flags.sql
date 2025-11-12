-- Add reminder flags to appointments, general_reminders, and medication_plans

-- Appointments: 2 days and 1 hour advance reminder flags
alter table if exists public.appointments
  add column if not exists remind_2days boolean not null default false,
  add column if not exists remind_1hour boolean not null default false;

-- General Reminders: 2 days and 1 hour advance reminder flags
alter table if exists public.general_reminders
  add column if not exists remind_2days boolean not null default false,
  add column if not exists remind_1hour boolean not null default false;

-- Medication Plans: weekly reminder flag
alter table if exists public.medication_plans
  add column if not exists remind_weekly boolean not null default false;
