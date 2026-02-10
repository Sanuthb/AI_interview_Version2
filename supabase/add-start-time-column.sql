-- Add start_time column to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
