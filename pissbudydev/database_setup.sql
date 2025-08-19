-- Piss Buddy Database Setup Script
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create exercise sessions table
CREATE TABLE IF NOT EXISTS exercise_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('kegel', 'sitting_standing', 'alongamento', 'elevacao_calcanhares', 'marcha_estacionaria')),
  repetitions INTEGER NOT NULL DEFAULT 10,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- Create progress tracking table for metrics like ICIQ-SF scores
CREATE TABLE IF NOT EXISTS progress_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('iciq_sf', 'other')),
  value NUMERIC NOT NULL,
  week_number INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question1_answer INTEGER,
  question2_answer INTEGER,
  question3_answer INTEGER,
  UNIQUE(user_id, metric_type, week_number) -- Prevent duplicate entries for same week
);

-- Create exercise plans table to store user's weekly exercise schedule
CREATE TABLE IF NOT EXISTS exercise_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date) -- One plan per user per week
);

-- Create exercise plan items table to store individual exercises for each day
CREATE TABLE IF NOT EXISTS exercise_plan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES exercise_plans(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('kegel', 'sitting_standing', 'alongamento', 'elevacao_calcanhares', 'marcha_estacionaria')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  repetitions INTEGER NOT NULL DEFAULT 10,
  duration_seconds INTEGER, -- For time-based exercises like marcha_estacionaria
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plan_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Users can insert own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Users can update own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Users can view own progress tracking" ON progress_tracking;
DROP POLICY IF EXISTS "Users can insert own progress tracking" ON progress_tracking;
DROP POLICY IF EXISTS "Users can update own progress tracking" ON progress_tracking;
DROP POLICY IF EXISTS "Users can view own exercise plans" ON exercise_plans;
DROP POLICY IF EXISTS "Users can insert own exercise plans" ON exercise_plans;
DROP POLICY IF EXISTS "Users can update own exercise plans" ON exercise_plans;
DROP POLICY IF EXISTS "Users can view own exercise plan items" ON exercise_plan_items;
DROP POLICY IF EXISTS "Users can insert own exercise plan items" ON exercise_plan_items;
DROP POLICY IF EXISTS "Users can update own exercise plan items" ON exercise_plan_items;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for exercise_sessions table
CREATE POLICY "Users can view own exercise sessions" ON exercise_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise sessions" ON exercise_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise sessions" ON exercise_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for progress_tracking table
CREATE POLICY "Users can view own progress tracking" ON progress_tracking 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress tracking" ON progress_tracking 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress tracking" ON progress_tracking 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for exercise_plans table
CREATE POLICY "Users can view own exercise plans" ON exercise_plans 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise plans" ON exercise_plans 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise plans" ON exercise_plans 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for exercise_plan_items table
CREATE POLICY "Users can view own exercise plan items" ON exercise_plan_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercise_plans 
      WHERE exercise_plans.id = exercise_plan_items.plan_id 
      AND exercise_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exercise plan items" ON exercise_plan_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_plans 
      WHERE exercise_plans.id = exercise_plan_items.plan_id 
      AND exercise_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exercise plan items" ON exercise_plan_items 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exercise_plans 
      WHERE exercise_plans.id = exercise_plan_items.plan_id 
      AND exercise_plans.user_id = auth.uid()
    )
  );

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.exercise_sessions TO anon, authenticated;
GRANT ALL ON public.progress_tracking TO anon, authenticated;
GRANT ALL ON public.exercise_plans TO anon, authenticated;
GRANT ALL ON public.exercise_plan_items TO anon, authenticated;

-- Function to get the start of the current week (Monday)
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Get Monday of the week containing input_date
  RETURN input_date - EXTRACT(DOW FROM input_date)::INTEGER + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a random exercise plan for a user with unique exercises per day
CREATE OR REPLACE FUNCTION generate_exercise_plan(p_user_id UUID, p_week_start DATE DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_week_start DATE;
  v_day INTEGER;
  v_all_exercises TEXT[] := ARRAY['kegel', 'sitting_standing', 'alongamento', 'elevacao_calcanhares', 'marcha_estacionaria'];
  v_daily_exercises TEXT[];
  v_exercise TEXT;
  v_repetitions INTEGER;
  v_duration INTEGER;
  v_num_exercises INTEGER;
  v_i INTEGER;
  v_j INTEGER;
  v_temp TEXT;
  v_random_index INTEGER;
BEGIN
  -- Use provided week_start or calculate current week start
  v_week_start := COALESCE(p_week_start, get_week_start());
  
  -- Check if a plan already exists for this user and week
  SELECT id INTO v_plan_id 
  FROM exercise_plans 
  WHERE user_id = p_user_id AND week_start_date = v_week_start;
  
  -- If plan already exists, return its ID
  IF v_plan_id IS NOT NULL THEN
    RETURN v_plan_id;
  END IF;
  
  -- Create the exercise plan
  INSERT INTO exercise_plans (user_id, week_start_date)
  VALUES (p_user_id, v_week_start)
  RETURNING id INTO v_plan_id;
  
  -- Generate exercises for each day of the week (0-6, Sunday to Saturday)
  FOR v_day IN 0..6 LOOP
    -- Copy all exercises to daily array for shuffling
    v_daily_exercises := v_all_exercises;
    
    -- Fisher-Yates shuffle algorithm to randomize exercise order
    v_i := array_length(v_daily_exercises, 1);
    WHILE v_i > 1 LOOP
      v_random_index := 1 + FLOOR(RANDOM() * v_i)::INTEGER;
      v_temp := v_daily_exercises[v_i];
      v_daily_exercises[v_i] := v_daily_exercises[v_random_index];
      v_daily_exercises[v_random_index] := v_temp;
      v_i := v_i - 1;
    END LOOP;
    
    -- Randomly select 2-3 unique exercises per day
    v_num_exercises := 2 + FLOOR(RANDOM() * 2)::INTEGER;
    
    -- Take the first v_num_exercises from shuffled array (ensures uniqueness)
    FOR v_j IN 1..v_num_exercises LOOP
      v_exercise := v_daily_exercises[v_j];
      
      -- Set repetitions and duration based on exercise type
      CASE v_exercise
        WHEN 'kegel' THEN
          v_repetitions := 10 + FLOOR(RANDOM() * 6)::INTEGER; -- 10-15 reps
          v_duration := NULL;
        WHEN 'sitting_standing' THEN
          v_repetitions := 8 + FLOOR(RANDOM() * 5)::INTEGER; -- 8-12 reps
          v_duration := NULL;
        WHEN 'alongamento' THEN
          v_repetitions := 3 + FLOOR(RANDOM() * 3)::INTEGER; -- 3-5 reps
          v_duration := 20 + FLOOR(RANDOM() * 11)::INTEGER; -- 20-30 seconds per rep
        WHEN 'elevacao_calcanhares' THEN
          v_repetitions := 10 + FLOOR(RANDOM() * 6)::INTEGER; -- 10-15 reps
          v_duration := NULL;
        WHEN 'marcha_estacionaria' THEN
          v_repetitions := 1; -- One session
          v_duration := 30 + FLOOR(RANDOM() * 91)::INTEGER; -- 30-120 seconds
        ELSE
          v_repetitions := 10;
          v_duration := NULL;
      END CASE;
      
      -- Insert the exercise plan item
      INSERT INTO exercise_plan_items (
        plan_id, 
        exercise_type, 
        day_of_week, 
        repetitions, 
        duration_seconds
      )
      VALUES (
        v_plan_id, 
        v_exercise, 
        v_day, 
        v_repetitions, 
        v_duration
      );
    END LOOP;
  END LOOP;
  
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION generate_exercise_plan(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_start(DATE) TO authenticated;

-- Helper function to get or create current week's exercise plan
CREATE OR REPLACE FUNCTION get_or_create_current_week_plan(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_week_start DATE;
BEGIN
  v_week_start := get_week_start();
  
  -- Try to get existing plan
  SELECT id INTO v_plan_id 
  FROM exercise_plans 
  WHERE user_id = p_user_id AND week_start_date = v_week_start;
  
  -- If no plan exists, generate one
  IF v_plan_id IS NULL THEN
    v_plan_id := generate_exercise_plan(p_user_id, v_week_start);
  END IF;
  
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get exercises for a specific day
CREATE OR REPLACE FUNCTION get_exercises_for_day(p_user_id UUID, p_day_of_week INTEGER)
RETURNS TABLE(
  id UUID,
  exercise_type TEXT,
  repetitions INTEGER,
  duration_seconds INTEGER,
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get or create current week's plan
  v_plan_id := get_or_create_current_week_plan(p_user_id);
  
  -- Return exercises for the specified day
  RETURN QUERY
  SELECT 
    epi.id,
    epi.exercise_type,
    epi.repetitions,
    epi.duration_seconds,
    epi.is_completed,
    epi.completed_at
  FROM exercise_plan_items epi
  WHERE epi.plan_id = v_plan_id 
    AND epi.day_of_week = p_day_of_week
  ORDER BY epi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark exercise as completed
CREATE OR REPLACE FUNCTION complete_exercise(p_exercise_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_exists BOOLEAN := FALSE;
BEGIN
  -- Verify the exercise belongs to the user
  SELECT EXISTS(
    SELECT 1 
    FROM exercise_plan_items epi
    JOIN exercise_plans ep ON epi.plan_id = ep.id
    WHERE epi.id = p_exercise_item_id 
      AND ep.user_id = p_user_id
  ) INTO v_plan_exists;
  
  IF NOT v_plan_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as completed
  UPDATE exercise_plan_items 
  SET 
    is_completed = TRUE,
    completed_at = NOW()
  WHERE id = p_exercise_item_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function to verify exercise plan generation
CREATE OR REPLACE FUNCTION test_exercise_plan_generation(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  day_of_week INTEGER,
  exercise_type TEXT,
  repetitions INTEGER,
  duration_seconds INTEGER
) AS $$
DECLARE
  v_test_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Use provided user_id or create a test UUID
  v_test_user_id := COALESCE(p_user_id, gen_random_uuid());
  
  -- Generate test plan
  v_plan_id := generate_exercise_plan(v_test_user_id);
  
  -- Return the generated exercises
  RETURN QUERY
  SELECT 
    epi.day_of_week,
    epi.exercise_type,
    epi.repetitions,
    epi.duration_seconds
  FROM exercise_plan_items epi
  WHERE epi.plan_id = v_plan_id
  ORDER BY epi.day_of_week, epi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_or_create_current_week_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exercises_for_day(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_exercise(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test_exercise_plan_generation(UUID) TO authenticated;
