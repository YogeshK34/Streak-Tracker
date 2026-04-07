# Database Schema Migration Guide

## Required Changes to Supabase

Run these SQL commands in your Supabase SQL editor to update the schema:

### 1. First, add the user_id column to habit_entries:

```sql
-- Add user_id column
ALTER TABLE habit_entries ADD COLUMN user_id uuid;

-- Add foreign key constraint to auth.users
ALTER TABLE habit_entries
ADD CONSTRAINT habit_entries_user_id_fk
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint on user_id + tracked_date for upsert operations
ALTER TABLE habit_entries
ADD CONSTRAINT habit_entries_user_id_tracked_date_unique
UNIQUE(user_id, tracked_date);

-- Create index for faster queries
CREATE INDEX habit_entries_user_id_idx ON habit_entries(user_id);
```

### 2. Update existing data (optional - if you have old data):

If you have existing habit_entries without user_id:
```sql
-- You can either:
-- A) Delete the old entries
DELETE FROM habit_entries WHERE user_id IS NULL;

-- B) Or migrate them to a specific user (replace 'your-user-id' with an actual user ID)
-- UPDATE habit_entries SET user_id = 'your-user-id' WHERE user_id IS NULL;
```

## Environment Variables

Make sure your `.env` file has these variables (should already be there):
```
NEXT_PUBLIC_SUPABASE_URL=https://zshcvblxhmotapsqvzse.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qA5qFL3661LQacCKbqk5lQ_evDLJqHq
```

## Authentication Flow

1. Users go to `/auth` page to sign up or log in
2. Upon successful auth, they're redirected to `/` (home page)
3. The app loads their habit data from the database
4. All habit updates are associated with their user ID
5. Users can sign out from the top right of the home page

## Testing the Implementation

1. Go to `http://localhost:3000`
2. You'll be redirected to `/auth` automatically
3. Sign up with an email and password
4. Mark some habits on the calendar
5. Refresh the page - your habits should still be there!
6. Sign out and sign in again - data persists
7. Sign up with a different email - that user has their own separate habits
