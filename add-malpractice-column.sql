-- Add malpractice column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS malpractice BOOLEAN DEFAULT FALSE;
