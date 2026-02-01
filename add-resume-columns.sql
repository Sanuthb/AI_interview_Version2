-- Add missing resume-related columns to candidates table
-- Run this script in Supabase SQL Editor

-- Add resume_text column (for storing extracted resume text)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS resume_text TEXT;

-- Add resume_analysis column (for storing AI analysis results)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS resume_analysis JSONB;

-- Add malpractice columns (for proctoring system)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS malpractice BOOLEAN DEFAULT FALSE;

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS malpractice_score INTEGER;

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS malpractice_details TEXT;

-- Add AI proctoring columns
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS risk_score INTEGER;

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'));

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS proctoring_summary JSONB;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_candidates_malpractice ON candidates(malpractice);
CREATE INDEX IF NOT EXISTS idx_candidates_risk_score ON candidates(risk_score);
