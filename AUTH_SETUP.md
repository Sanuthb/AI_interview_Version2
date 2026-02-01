# Authentication Setup Guide

This guide will help you set up authentication for the Placement AI Interview System.

## Overview

The system now uses Supabase Auth for secure user authentication. Candidates must sign up and log in to access their dashboard.

## Step 1: Enable Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Enable **Email** authentication provider
4. Configure email settings:
   - **Enable email confirmations**: Toggle ON (recommended for production)
   - **Site URL**: Your application URL (e.g., `http://localhost:3000` for development)
   - **Redirect URLs**: Add your redirect URLs

## Step 2: Run Authentication Schema

1. Go to **SQL Editor** in Supabase
2. Copy and run the contents of `supabase-auth-schema.sql`
3. This will create:
   - `user_profiles` table to link auth users to candidates
   - Triggers to automatically create profiles
   - Functions to link candidates to users

## Step 3: Update RLS Policies (Optional but Recommended)

The schema includes basic RLS policies. For production, you may want to customize them:

```sql
-- Example: Only allow candidates to view their own data
CREATE POLICY "Candidates can view own data" ON candidates
  FOR SELECT USING (
    id IN (
      SELECT candidate_id FROM user_profiles WHERE id = auth.uid()
    )
  );
```

## Step 4: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/signup`
3. Create an account with:
   - Email that matches a candidate in the database
   - USN that matches a candidate in the database
   - Password (minimum 6 characters)
4. Check your email for verification (if email confirmation is enabled)
5. Sign in at `/login`

## How It Works

### Sign Up Process

1. User enters: Name, USN, Email, Password
2. System checks if candidate exists with matching email or USN
3. If found, creates auth user account
4. Links the candidate to the user profile
5. User receives verification email (if enabled)

### Sign In Process

1. User enters email and password
2. Supabase Auth verifies credentials
3. System fetches linked candidate profile
4. User is redirected to dashboard

### Candidate Dashboard

- Automatically loads candidate data based on authenticated user
- No need to enter USN manually
- Secure and personalized

## Troubleshooting

### "Candidate not found" during signup

- Make sure the candidate exists in the `candidates` table
- Email or USN must match exactly (case-sensitive for email)
- Check that the candidate was created when the interview was set up

### "No candidate profile linked"

- The `user_profiles` table might not have the candidate linked
- Run the linking function manually:
  ```sql
  SELECT public.link_candidate_to_user('USN_HERE', 'email@example.com');
  ```

### Email verification not working

- Check Supabase Auth settings
- Verify email templates are configured
- Check spam folder
- For development, you can disable email confirmation temporarily

## Security Notes

- Passwords are hashed and stored securely by Supabase
- Never expose API keys in client-side code
- Use RLS policies to restrict data access
- Regularly review and update authentication settings

## Next Steps

- Set up admin authentication (separate role)
- Configure password reset functionality
- Add two-factor authentication (if needed)
- Set up session management policies

