"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Upload, FileText, Loader2, XCircle } from "lucide-react";
import { createInterview } from "@/lib/services/interviews";
import { createCandidatesBulk } from "@/lib/services/candidates";
import { uploadJobDescription } from "@/lib/services/storage";
import { parseJobDescription } from "@/lib/services/jd-parser";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function CreateInterviewPage() {
  const router = useRouter();
  const [jdMethod, setJdMethod] = useState<"upload" | "paste">("paste");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [candidatesFile, setCandidatesFile] = useState<File | null>(null);
  const [interviewType, setInterviewType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [jdName, setJdName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingJD, setIsParsingJD] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleParseJD = async () => {
    if (jdMethod === "upload" && !jdFile) {
      toast.error("Please select a job description file first");
      return;
    }
    if (jdMethod === "paste" && !jdText.trim()) {
      toast.error("Please paste the job description text first");
      return;
    }

    setIsParsingJD(true);
    setError(null);

    try {
      toast.info("Analyzing job description with AI...");
      const parsed = await parseJobDescription(
        jdMethod === "upload" ? jdFile : null,
        jdMethod === "paste" ? jdText : null,
      );

      // Auto-fill form fields
      if (parsed.title) {
        setTitle(parsed.title);
      }
      if (parsed.jdName) {
        setJdName(parsed.jdName);
      }
      if (parsed.interviewType) {
        setInterviewType(parsed.interviewType);
      }
      if (parsed.duration) {
        setDuration(parsed.duration);
      }

      toast.success(
        "Job description analyzed! Form fields have been auto-filled.",
      );
    } catch (err: any) {
      console.error("Error parsing JD:", err);
      setError(
        err.message ||
          "Failed to parse job description. You can still fill the form manually.",
      );
      toast.error(err.message || "Failed to parse job description");
    } finally {
      setIsParsingJD(false);
    }
  };

  const parseExcelFile = async (
    file: File,
  ): Promise<
    Array<{
      name: string;
      usn: string;
      email?: string;
      batch?: string;
      dept?: string;
    }>
  > => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const text = await file.text();

    // Handle CSV files
    if (fileExtension === "csv" || fileExtension === "txt") {
      // Try different line endings
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        throw new Error("File is empty");
      }

      // Try to detect delimiter (comma, semicolon, or tab)
      const firstLine = lines[0];
      let delimiter = ",";
      if (
        firstLine.includes(";") &&
        firstLine.split(";").length > firstLine.split(",").length
      ) {
        delimiter = ";";
      } else if (firstLine.includes("\t")) {
        delimiter = "\t";
      }

      const headers = firstLine
        .split(delimiter)
        .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

      const nameIndex = headers.findIndex(
        (h) => h.includes("name") && !h.includes("usn"),
      );
      const usnIndex = headers.findIndex(
        (h) => h.includes("usn") || h.includes("student") || h.includes("id"),
      );
      const emailIndex = headers.findIndex(
        (h) => h.includes("email") || h.includes("mail"),
      );
      const batchIndex = headers.findIndex(
        (h) => h.includes("batch") || h.includes("year"),
      );
      const deptIndex = headers.findIndex(
        (h) =>
          h.includes("dept") ||
          h.includes("department") ||
          h.includes("branch"),
      );

      if (nameIndex === -1 || usnIndex === -1) {
        throw new Error(
          `CSV file must have "Name" and "USN" columns. Found columns: ${headers.join(", ")}`,
        );
      }

      const candidates = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted values
        const values = line.split(delimiter).map((v) => {
          let val = v.trim();
          // Remove surrounding quotes if present
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          return val;
        });

        const name = values[nameIndex]?.trim();
        const usn = values[usnIndex]?.trim();
        const email = emailIndex >= 0 ? values[emailIndex]?.trim() : undefined;
        const batch = batchIndex >= 0 ? values[batchIndex]?.trim() : undefined;
        const dept = deptIndex >= 0 ? values[deptIndex]?.trim() : undefined;

        if (name && usn) {
          candidates.push({
            name,
            usn,
            email: email || undefined,
            batch: batch || undefined,
            dept: dept || undefined,
          });
        }
      }

      if (candidates.length === 0) {
        throw new Error(
          `No valid candidates found. Make sure your CSV has data rows with Name and USN columns.`,
        );
      }

      return candidates;
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          throw new Error("Excel file is empty");
        }

        // Map columns dynamically
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow);

        const nameKey = keys.find(
          (k) =>
            k.toLowerCase().includes("name") &&
            !k.toLowerCase().includes("usn"),
        );
        const usnKey = keys.find(
          (k) =>
            k.toLowerCase().includes("usn") ||
            k.toLowerCase().includes("student") ||
            k.toLowerCase().includes("id"),
        );
        const emailKey = keys.find(
          (k) =>
            k.toLowerCase().includes("email") ||
            k.toLowerCase().includes("mail"),
        );
        const batchKey = keys.find(
          (k) =>
            k.toLowerCase().includes("batch") ||
            k.toLowerCase().includes("year"),
        );
        const deptKey = keys.find(
          (k) =>
            k.toLowerCase().includes("dept") ||
            k.toLowerCase().includes("department") ||
            k.toLowerCase().includes("branch"),
        );

        if (!nameKey || !usnKey) {
          throw new Error(
            `Excel file must have "Name" and "USN" columns. Found columns: ${keys.join(", ")}`,
          );
        }

        const candidates = jsonData
          .map((row) => ({
            name: row[nameKey]?.toString().trim(),
            usn: row[usnKey]?.toString().trim(),
            email: emailKey ? row[emailKey]?.toString().trim() : undefined,
            batch: batchKey ? row[batchKey]?.toString().trim() : undefined,
            dept: deptKey ? row[deptKey]?.toString().trim() : undefined,
          }))
          .filter((c) => c.name && c.usn);

        if (candidates.length === 0) {
          throw new Error(
            "No valid candidates found in Excel file. Ensure Name and USN are present.",
          );
        }

        return candidates;
      } catch (err: any) {
        throw new Error(`Failed to parse Excel file: ${err.message}`);
      }
    } else {
      throw new Error(
        `Unsupported file format (.${fileExtension}). Please upload a CSV or Excel file.`,
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error("Interview title is required");
      }
      if (!jdName.trim()) {
        throw new Error("Job description name is required");
      }
      if (jdMethod === "paste" && !jdText.trim()) {
        throw new Error("Job description text is required");
      }
      if (jdMethod === "upload" && !jdFile) {
        throw new Error("Job description file is required");
      }
      if (!candidatesFile) {
        throw new Error("Candidates file is required");
      }

      // Upload JD file if provided
      let jdFileUrl: string | undefined;
      if (jdFile) {
        toast.info("Uploading job description file...");
        // We'll upload after creating the interview
      }

      // Create interview
      toast.info("Creating interview...");
      const interview = await createInterview({
        title: title.trim(),
        jd_name: jdName.trim(),
        jd_text: jdMethod === "paste" ? jdText.trim() : undefined,
        jd_file_url: jdFileUrl,
        interview_type: interviewType || undefined,
        duration: duration ? parseInt(duration) : undefined,
        status: "Active",
      });

      // Upload JD file if provided (now we have interview ID)
      if (jdFile && interview.id) {
        try {
          jdFileUrl = await uploadJobDescription(jdFile, interview.id);
          // Update interview with file URL
          const { updateInterview } = await import("@/lib/services/interviews");
          await updateInterview(interview.id, { jd_file_url: jdFileUrl });
        } catch (uploadError) {
          console.error("Error uploading JD file:", uploadError);
          // Continue even if file upload fails
        }
      }

      // Parse and create candidates
      toast.info("Processing candidates...");
      let candidates: Array<{
        name: string;
        usn: string;
        email?: string;
        batch?: string;
        dept?: string;
      }>;

      try {
        candidates = await parseExcelFile(candidatesFile);
        console.log("candidates", candidates);
      } catch (parseError: any) {
        console.log("parseError", parseError);
        throw new Error(
          `Failed to parse candidates file: ${parseError.message}`,
        );
      }

      if (candidates.length === 0) {
        throw new Error(
          "No valid candidates found in the file. Please check the file format.",
        );
      }

      toast.info(`Found ${candidates.length} candidate(s) in the file`);

      // Check for existing candidates before creating
      toast.info("Checking for existing candidates...");
      const existingCandidatesResponse = await fetch(
        `/api/admin/candidates/check-existing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usns: candidates.map((c) => c.usn.trim()),
            interviewId: interview.id,
          }),
        },
      );

      if (!existingCandidatesResponse.ok) {
        throw new Error("Failed to check existing candidates");
      }

      const { existingUSNs } = await existingCandidatesResponse.json();

      // Filter out candidates that already exist in this interview
      const newCandidates = candidates.filter(
        (c) => !existingUSNs.includes(c.usn.trim()),
      );
      const duplicateCount = candidates.length - newCandidates.length;

      if (duplicateCount > 0) {
        toast.warning(
          `${duplicateCount} candidate(s) already exist in this interview and were skipped`,
        );
      }

      if (newCandidates.length === 0) {
        toast.info(
          "All candidates from the file already exist in this interview",
        );
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/admin/interviews`);
        }, 2000);
        return;
      }

      const result = await createCandidatesBulk(
        newCandidates.map((c) => ({
          ...c,
          interview_id: interview.id,
        })),
      );

      if (result.skipped && result.skipped.length > 0) {
        const skippedUsns = result.skipped.map((s) => s.usn).join(", ");
        toast.warning(
          `Interview created, but ${result.skipped.length} students were skipped because they don't have an account: ${skippedUsns}`,
          { duration: 8000 },
        );
      } else {
        toast.success(
          "Interview created and all candidates assigned successfully!",
        );
      }
      setShowSuccess(true);

      // Reset form
      setTimeout(() => {
        setTitle("");
        setJdName("");
        setJdText("");
        setJdFile(null);
        setCandidatesFile(null);
        setInterviewType("");
        setDuration("");
        setShowSuccess(false);
        router.push(`/admin/interviews`);
      }, 2000);
    } catch (err: any) {
      console.error("Error creating interview:", err);
      setError(err.message || "Failed to create interview. Please try again.");
      toast.error(err.message || "Failed to create interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Interview</h1>
        <p className="text-muted-foreground">
          Set up a new placement interview with job description and candidates
        </p>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">
            Error
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Interview Created Successfully!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            The interview has been assigned and candidates have been notified.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Software Engineer - Google"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jd-name">Job Description Name *</Label>
              <Input
                id="jd-name"
                placeholder="e.g., Google SWE JD 2024"
                value={jdName}
                onChange={(e) => setJdName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={jdMethod === "paste" ? "default" : "outline"}
                onClick={() => setJdMethod("paste")}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste JD
              </Button>
              <Button
                type="button"
                variant={jdMethod === "upload" ? "default" : "outline"}
                onClick={() => setJdMethod("upload")}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>

            {jdMethod === "paste" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="jd-text">Job Description Text</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleParseJD}
                    disabled={isParsingJD || !jdText.trim()}
                  >
                    {isParsingJD ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-3 w-3" />
                        Auto-fill with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="jd-text"
                  placeholder="Paste the job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Click "Auto-fill with AI" to automatically extract
                  interview details
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="jd-file">Upload Job Description</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jd-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="flex-1"
                    onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  />
                  {(jdFile || jdText) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleParseJD}
                      disabled={isParsingJD}
                    >
                      {isParsingJD ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-3 w-3" />
                          Auto-fill
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {jdFile && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Selected: {jdFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Click "Auto-fill" to automatically extract
                      interview details from the file
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidates-file">Upload Excel/CSV File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="candidates-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="flex-1"
                  onChange={(e) =>
                    setCandidatesFile(e.target.files?.[0] || null)
                  }
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file containing candidate information. Required
                columns: <strong>Name</strong>, <strong>USN</strong> (optional:
                Email, Batch, Department)
              </p>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p>Example CSV format:</p>
                <code className="text-xs bg-muted p-1 rounded block">
                  Name,USN,Email,Batch,Department
                  <br />
                  John Doe,1NH20CS001,john@example.com,2024,CSE
                </code>
                <a
                  href="/sample-candidates.csv"
                  download
                  className="text-blue-600 hover:underline inline-block mt-1"
                >
                  📥 Download sample CSV file
                </a>
              </div>
              {candidatesFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {candidatesFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Settings (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interview-type">Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger id="interview-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                    <SelectItem value="Coding Round">Coding Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/interviews")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Assign Interview"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
