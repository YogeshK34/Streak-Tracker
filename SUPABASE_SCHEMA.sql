-- Run these statements in the Supabase SQL editor or via the Supabase CLI.

create table if not exists habit_entries (
  id bigint generated always as identity primary key,
  tracked_date date not null unique,
  created_at timestamptz not null default now()
);
