# Supabase Setup Guide

This guide will help you set up Supabase for the Placement AI Interview System.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `placement-ai` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose the closest region
4. Click "Create new project" and wait for it to be ready

## Step 2: Set Up Database Schema

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` file
3. Paste it into the SQL Editor
4. Click "Run" to execute the SQL script

This will create:
- `interviews` table
- `candidates` table
- Indexes for better performance
- Row Level Security (RLS) policies

## Step 3: Create Storage Buckets

### Create the Buckets

1. Go to **Storage** in your Supabase dashboard (left sidebar)
2. Click **"New bucket"** button
3. Create the first bucket:
   - **Name**: `resumes` (must be exactly this name)
   - **Public bucket**: Toggle ON (or OFF if you want private access)
   - Click **"Create bucket"**

4. Create the second bucket:
   - Click **"New bucket"** again
   - **Name**: `job-descriptions` (must be exactly this name)
   - **Public bucket**: Toggle ON (or OFF if you want private access)
   - Click **"Create bucket"**

### Set Up Storage Policies

For each bucket (`resumes` and `job-descriptions`), you need to set up policies to allow file uploads and reads:

#### Option 1: Public Buckets (Easier for development)

If your buckets are public, you can skip this step as public buckets allow all operations by default.

#### Option 2: Private Buckets or Custom Policies

1. Click on the bucket name (e.g., `resumes`)
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"For full customization"**
5. Create a policy for **INSERT** (upload):
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Policy definition: `true` (or customize based on your needs)
   - Click **"Review"** then **"Save policy"**

6. Create a policy for **SELECT** (read):
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT`
   - Policy definition: `true`
   - Click **"Review"** then **"Save policy"**

7. Repeat steps 1-6 for the `job-descriptions` bucket

### Quick Setup (SQL Method)

Alternatively, you can create buckets using SQL in the SQL Editor:

```sql
-- Create resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create job-descriptions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-descriptions',
  'job-descriptions',
  true,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Create policies for resumes bucket
CREATE POLICY "Allow public uploads to resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow public reads from resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Create policies for job-descriptions bucket
CREATE POLICY "Allow public uploads to job-descriptions"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'job-descriptions');

CREATE POLICY "Allow public reads from job-descriptions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-descriptions');
```

**Note**: If you get an error about the buckets table, make sure you're using the correct Supabase project and that Storage is enabled.

## Step 4: Get API Keys

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace:
- `your_project_url_here` with your Project URL from Step 4
- `your_anon_key_here` with your anon/public key from Step 4
- `your_gemini_api_key_here` with your Gemini API key (see `GEMINI_SETUP.md` for instructions)

**Note**: The `GEMINI_API_KEY` is optional but required for the AI-powered job description parsing feature. If you don't need this feature, you can omit it.

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000
3. Try creating an interview in the Admin Portal
4. Check your Supabase dashboard to verify data is being created

## Troubleshooting

### Error: "Supabase environment variables are not set"
- Make sure `.env.local` exists in the project root
- Verify the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after adding environment variables

### Error: "relation does not exist"
- Make sure you ran the SQL schema script in Step 2
- Check that the tables were created in the Table Editor

### Error: "new row violates row-level security policy"
- Check your RLS policies in Supabase
- Make sure the policies allow the operations you're trying to perform

### File upload errors
- Verify storage buckets are created (Step 3)
- Check bucket policies allow INSERT operations
- Verify file size is within the bucket limits

## Next Steps

- Set up authentication if needed (Supabase Auth)
- Configure more restrictive RLS policies for production
- Set up backups for your database
- Configure custom domains for storage if needed

## Support

For more help:
- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

