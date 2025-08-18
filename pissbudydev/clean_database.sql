-- Clean Database Script for Piss Buddy App
-- Run this in your Supabase SQL Editor to clean all data

-- WARNING: This will delete ALL data from the database!
-- Make sure you want to do this before running these commands.

-- Clean all data from tables (but keep the table structure)
DELETE FROM progress_tracking;
DELETE FROM exercise_sessions;
DELETE FROM profiles;

-- Reset any sequences if needed (optional)
-- This ensures that auto-generated IDs start from 1 again
-- Note: UUIDs don't use sequences, but including this for completeness
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS exercise_sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS progress_tracking_id_seq RESTART WITH 1;

-- Verify that tables are empty
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'exercise_sessions' as table_name, COUNT(*) as record_count FROM exercise_sessions
UNION ALL
SELECT 'progress_tracking' as table_name, COUNT(*) as record_count FROM progress_tracking;

-- Optional: If you want to completely drop and recreate tables, uncomment below:
/*
-- Drop all tables (THIS WILL COMPLETELY REMOVE ALL TABLES AND DATA!)
DROP TABLE IF EXISTS progress_tracking CASCADE;
DROP TABLE IF EXISTS exercise_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- After running this, you would need to run the database_setup.sql script again
-- to recreate all tables, policies, and triggers.
*/
