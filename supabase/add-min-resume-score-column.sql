-- Add min_resume_score column to interviews table
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS min_resume_score INTEGER DEFAULT 70;

-- Optional: Update existing records to have 70 if they are null
UPDATE interviews 
SET min_resume_score = 70 
WHERE min_resume_score IS NULL;
