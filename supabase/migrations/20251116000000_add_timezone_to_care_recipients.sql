-- Add timezone column to care_recipients
alter table if exists public.care_recipients
add column if not exists timezone text;


