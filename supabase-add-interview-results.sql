-- Create interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  transcript JSONB,
  report JSONB,
  communication_score INTEGER,
  skills_score INTEGER,
  knowledge_score INTEGER,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on interview_results" ON interview_results
  FOR ALL USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS  feedback_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);