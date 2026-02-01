# Gemini AI Setup Guide

This guide will help you set up Google Gemini AI for automatic job description parsing.

## Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy your API key (it will look like: `AIzaSy...`)

## Step 2: Add API Key to Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following line:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with the API key you copied in Step 1.

3. Save the file

## Step 3: Restart Development Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 4: Test the Feature

1. Go to Admin Portal → Create Interview
2. Upload a job description file or paste JD text
3. Click **"Auto-fill with AI"** button
4. The form should automatically fill with:
   - Interview Title
   - Job Description Name
   - Interview Type
   - Duration

## How It Works

When you click "Auto-fill with AI":
1. The job description is sent to Gemini AI
2. Gemini analyzes the JD and extracts:
   - Job title/position
   - Short JD name
   - Interview type (Technical, HR, Mixed, Coding Round)
   - Interview duration
   - Key skills
   - Summary
3. The form fields are automatically filled with the extracted information

## Supported File Formats

- **Text files** (.txt) - Full support
- **PDF files** (.pdf) - Full support
- **Word documents** (.doc, .docx) - Basic support (may need conversion)

## Troubleshooting

### Error: "GEMINI_API_KEY is not set"
- Make sure you've added `GEMINI_API_KEY` to your `.env.local` file
- Restart your development server after adding the key
- Check that the key name is exactly `GEMINI_API_KEY` (case-sensitive)

### Error: "API key not valid"
- Verify your API key is correct
- Make sure you haven't added extra spaces or quotes around the key
- Check that the API key is active in Google AI Studio

### Error: "Failed to parse job description"
- The JD might be too short or unclear
- Try pasting the text directly instead of uploading a file
- Make sure the JD contains clear information about the role

### PDF files not working
- Make sure `pdf-parse` package is installed: `npm install pdf-parse`
- Try converting the PDF to text format
- Some PDFs with images or complex formatting may not work

## API Usage

The Gemini API has usage limits based on your plan:
- Free tier: Limited requests per minute
- Paid tier: Higher limits

If you hit rate limits, wait a few minutes and try again.

## Security Note

⚠️ **Important**: Never commit your `.env.local` file to version control. It contains sensitive API keys.

The `.env.local` file should already be in `.gitignore`, but double-check to ensure your API key is not exposed.

