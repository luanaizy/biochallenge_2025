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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Users can insert own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Users can view own progress tracking" ON progress_tracking;
DROP POLICY IF EXISTS "Users can insert own progress tracking" ON progress_tracking;

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
