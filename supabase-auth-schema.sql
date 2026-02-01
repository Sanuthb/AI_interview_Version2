-- Add authentication support to existing schema
-- Run this AFTER creating the base schema

-- Add email and password fields to candidates table (if not already present)
-- Note: We'll use Supabase Auth for authentication, but we need to link auth users to candidates

-- Create a user_profiles table to link Supabase Auth users to candidates
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  usn TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_candidate_id ON user_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usn ON user_profiles(usn);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow inserting profile during signup (with service role or authenticated user)
CREATE POLICY "Allow profile creation" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create user_profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'candidate');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add function to link candidate to user profile
CREATE OR REPLACE FUNCTION public.link_candidate_to_user(
  p_usn TEXT,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_candidate_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Find candidate by USN and email
  SELECT id INTO v_candidate_id
  FROM candidates
  WHERE usn = p_usn AND (email = p_email OR email IS NULL)
  LIMIT 1;
  
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Candidate not found with provided USN and email';
  END IF;
  
  -- Link candidate to user profile
  UPDATE user_profiles
  SET candidate_id = v_candidate_id, usn = p_usn
  WHERE id = v_user_id;
  
  RETURN v_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

