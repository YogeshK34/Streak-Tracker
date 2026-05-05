-- Habit Tracker: Initial Database Schema
-- Run these statements in the Supabase SQL editor or via the Supabase CLI.

-- Habit Entries: tracks daily habit completion
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

-- LeetCode problems tracker: stores problems solved with notes
create table if not exists leetcode_problems (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_date date not null,
  problem_name text not null,
  description text,
  data_structure text,
  technique text[],
  created_at timestamptz not null default now()
);

create index if not exists leetcode_problems_user_id_idx on leetcode_problems(user_id);
create index if not exists leetcode_problems_user_date_idx on leetcode_problems(user_id, problem_date desc);

-- RLS Policies for leetcode_problems
alter table leetcode_problems enable row level security;

create policy "Users can view own leetcode problems"
  on leetcode_problems for select
  using (auth.uid() = user_id);

create policy "Users can insert own leetcode problems"
  on leetcode_problems for insert
  with check (auth.uid() = user_id);

create policy "Users can update own leetcode problems"
  on leetcode_problems for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own leetcode problems"
  on leetcode_problems for delete
  using (auth.uid() = user_id);

-- Data Structures Notes table: stores learning notes for DS concepts
create table if not exists ds_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ds_name text not null,
  concept_name text not null,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ds_notes_user_id_idx on ds_notes(user_id);
create index if not exists ds_notes_user_ds_idx on ds_notes(user_id, ds_name);

-- RLS Policies for ds_notes
alter table ds_notes enable row level security;

create policy "Users can view own ds notes"
  on ds_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own ds notes"
  on ds_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ds notes"
  on ds_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own ds notes"
  on ds_notes for delete
  using (auth.uid() = user_id);
