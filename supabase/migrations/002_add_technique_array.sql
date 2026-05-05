-- Migration: Convert technique column from text to text[] (array)
-- This allows storing multiple techniques per LeetCode problem
-- Run this in the Supabase SQL editor if the table already exists with data

-- Step 1: Add a temporary column with the new array type
ALTER TABLE leetcode_problems
ADD COLUMN technique_temp text[];

-- Step 2: Copy and convert existing data
-- For rows with existing technique values, wrap them in an array
-- For rows with NULL, keep NULL
UPDATE leetcode_problems
SET technique_temp = CASE
  WHEN technique IS NOT NULL AND technique != '' THEN ARRAY[technique]
  ELSE NULL
END;

-- Step 3: Drop the old column
ALTER TABLE leetcode_problems
DROP COLUMN technique;

-- Step 4: Rename the temporary column to the original name
ALTER TABLE leetcode_problems
RENAME COLUMN technique_temp TO technique;

-- Verification: Check the migration worked
-- SELECT id, problem_name, technique FROM leetcode_problems LIMIT 10;
