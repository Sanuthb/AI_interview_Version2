-- Create interviews table
-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  jd_name TEXT NOT NULL,
  jd_text TEXT,
  jd_file_url TEXT,
  interview_type TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  usn TEXT NOT NULL,
  email TEXT,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  batch TEXT,
  dept TEXT,
  resume_score INTEGER,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Promoted', 'Not Promoted', 'Pending')),
  -- New fields for enhanced logic
  resume_status TEXT NOT NULL DEFAULT 'Pending' CHECK (resume_status IN ('Pending', 'Passed', 'Failed')),
  interview_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (interview_status IN ('Not Started', 'Enabled', 'Completed', 'Locked')),
  manually_promoted BOOLEAN DEFAULT FALSE,
  override_by_admin BOOLEAN DEFAULT FALSE,
  manual_interview_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_interview_id ON candidates(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_log_candidate_id ON admin_actions_log(candidate_id);

-- Create storage buckets (run these in Supabase Storage section or via API)
-- Bucket: 'resumes' - for candidate resume files
-- Bucket: 'job-descriptions' - for job description files

-- Enable Row Level Security (RLS)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations (you should restrict based on user roles)
CREATE POLICY "Allow all operations on interviews" ON interviews
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on candidates" ON candidates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_actions_log" ON admin_actions_log
  FOR ALL USING (true) WITH CHECK (true);

