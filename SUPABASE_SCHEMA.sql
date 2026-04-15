-- Run these statements in the Supabase SQL editor or via the Supabase CLI.

create table if not exists habit_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tracked_date date not null,
  completion_hour int check (completion_hour >= 0 and completion_hour <= 23),
  created_at timestamptz not null default now(),
  unique(user_id, tracked_date)
);

create index if not exists habit_entries_user_id_idx on habit_entries(user_id);

-- Streak history: tracks when streaks end and their length
create table if not exists streak_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  length int not null,
  created_at timestamptz not null default now()
);

create index if not exists streak_history_user_id_end_date_idx on streak_history(user_id, end_date desc);

-- Completion times: tracks what hour of day habits were marked
create table if not exists habit_completion_times (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_date date not null,
  completion_hour int not null check (completion_hour >= 0 and completion_hour <= 23),
  created_at timestamptz not null default now(),
  unique(user_id, habit_date)
);

create index if not exists habit_completion_times_user_id_idx on habit_completion_times(user_id);

-- Achievements: user badges and milestones
create table if not exists achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_type text not null,
  achieved_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, badge_type)
);

create index if not exists achievements_user_id_idx on achievements(user_id);
