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
