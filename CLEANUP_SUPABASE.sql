-- Clean up unused tables from Supabase
-- Run this in your Supabase SQL Editor if you want to remove the old data

-- Drop achievements table (no longer needed)
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop habit_completion_times table (no longer needed for time analysis)
DROP TABLE IF EXISTS habit_completion_times CASCADE;
