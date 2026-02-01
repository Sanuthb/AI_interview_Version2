# How to Add Candidates

## Option 1: Using CSV File (Recommended)

### Step 1: Create a CSV File

Create a CSV file with the following format:

```csv
Name,USN,Email
John Doe,1NH20CS001,john.doe@example.com
Jane Smith,1NH20CS002,jane.smith@example.com
Bob Johnson,1NH20CS003,bob.johnson@example.com
```

### Step 2: CSV File Requirements

1. **Required Columns:**
   - `Name` - Candidate's full name
   - `USN` - University Seat Number (unique identifier)

2. **Optional Columns:**
   - `Email` - Candidate's email address

3. **File Format:**
   - File extension: `.csv` or `.txt`
   - Delimiter: Comma (`,`) or semicolon (`;`) or tab
   - Encoding: UTF-8 (recommended)
   - First row must contain column headers

### Step 3: Sample CSV File

You can download a sample CSV file from the Create Interview page, or create one manually:

**sample-candidates.csv:**
```csv
Name,USN,Email
John Doe,1NH20CS001,john.doe@example.com
Jane Smith,1NH20CS002,jane.smith@example.com
Bob Johnson,1NH20CS003,bob.johnson@example.com
Alice Williams,1NH20CS004,alice.williams@example.com
Charlie Brown,1NH20CS005,charlie.brown@example.com
```

### Step 4: Create Interview with CSV

1. Go to Admin Portal → Create Interview
2. Fill in the interview details
3. Upload your CSV file in the "Candidates" section
4. Click "Assign Interview"

## Common Issues and Solutions

### Issue: "No valid candidates found in the file"

**Possible Causes:**
1. CSV file doesn't have the required columns (Name, USN)
2. Column names don't match exactly (case-insensitive, but must contain "name" and "usn")
3. Data rows are empty or missing required fields
4. File encoding issues

**Solutions:**
1. Check that your CSV has headers: `Name,USN` or `name,usn` or `NAME,USN`
2. Ensure each data row has both Name and USN values
3. Remove empty rows
4. Save the file as UTF-8 encoding
5. Use the sample CSV file as a template

### Issue: "CSV file must have Name and USN columns"

**Solution:**
- Make sure your CSV file's first row contains column headers
- Headers should include a column with "name" (or "Name", "NAME")
- Headers should include a column with "usn" (or "USN", "Student ID", etc.)

### Issue: Excel files not working

**Solution:**
- Excel files (.xlsx, .xls) are not directly supported
- Save your Excel file as CSV format:
  1. Open in Excel
  2. File → Save As
  3. Choose "CSV (Comma delimited) (*.csv)"
  4. Save and upload

## Creating CSV in Different Tools

### Microsoft Excel
1. Open Excel
2. Create columns: Name, USN, Email
3. Add your data
4. File → Save As
5. Choose "CSV (Comma delimited) (*.csv)"
6. Save

### Google Sheets
1. Create your spreadsheet with columns: Name, USN, Email
2. File → Download → Comma-separated values (.csv)

### Text Editor (Notepad, VS Code, etc.)
1. Create a new file
2. Add header row: `Name,USN,Email`
3. Add data rows, one per line: `John Doe,1NH20CS001,john@example.com`
4. Save as `.csv` file

## Example CSV Files

### Minimal (Required columns only)
```csv
Name,USN
John Doe,1NH20CS001
Jane Smith,1NH20CS002
```

### With Email
```csv
Name,USN,Email
John Doe,1NH20CS001,john.doe@example.com
Jane Smith,1NH20CS002,jane.smith@example.com
```

### With Different Column Names (also works)
```csv
Student Name,University Seat Number,Email Address
John Doe,1NH20CS001,john.doe@example.com
Jane Smith,1NH20CS002,jane.smith@example.com
```

## Tips

1. **Always include headers** - The first row must contain column names
2. **No empty rows** - Remove blank lines between data
3. **Consistent format** - Keep the same format for all rows
4. **Unique USNs** - Each candidate should have a unique USN
5. **Test with sample** - Use the sample CSV file first to verify the format works

## Need Help?

If you continue to have issues:
1. Check the error message - it will tell you what's wrong
2. Use the sample CSV file as a reference
3. Verify your file is saved as `.csv` format
4. Make sure the file is not corrupted or empty

