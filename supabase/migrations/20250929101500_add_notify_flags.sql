-- Add notification channel flags (SMS/Call/WhatsApp)

-- Appointments
alter table if exists public.appointments
  add column if not exists notify_sms boolean not null default false,
  add column if not exists notify_call boolean not null default false,
  add column if not exists notify_whatsapp boolean not null default false;

-- General Reminders
alter table if exists public.general_reminders
  add column if not exists notify_sms boolean not null default false,
  add column if not exists notify_call boolean not null default false,
  add column if not exists notify_whatsapp boolean not null default false;
