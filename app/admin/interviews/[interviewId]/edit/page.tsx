"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { CheckCircle2, Upload, FileText, Loader2, XCircle, ArrowLeft } from "lucide-react";
import { getInterviewById, updateInterview } from "@/lib/services/interviews";
import { uploadJobDescription } from "@/lib/services/storage";
import { parseJobDescription } from "@/lib/services/jd-parser";
import { toast } from "sonner";
import Link from "next/link";

export default function EditInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.interviewId as string;

  const [jdMethod, setJdMethod] = useState<"upload" | "paste">("paste");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [interviewType, setInterviewType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [minResumeScore, setMinResumeScore] = useState<number>(70);
  const [title, setTitle] = useState<string>("");
  const [jdName, setJdName] = useState<string>("");
  const [status, setStatus] = useState<"Active" | "Closed">("Active");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingJD, setIsParsingJD] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    setIsLoading(true);
    try {
      const interview = await getInterviewById(interviewId);
      if (interview) {
        setTitle(interview.title);
        setJdName(interview.jd_name);
        setJdText(interview.jd_text || "");
        setInterviewType(interview.interview_type || "");
        setDuration(interview.duration?.toString() || "");
        setMinResumeScore(interview.min_resume_score || 70);
        setStatus(interview.status as "Active" | "Closed");
        if (interview.start_time) setStartTime(new Date(interview.start_time).toISOString().slice(0, 16));
        if (interview.end_time) setEndTime(new Date(interview.end_time).toISOString().slice(0, 16));
      } else {
        setError("Interview not found");
      }
    } catch (err) {
      console.error("Error fetching interview:", err);
      setError("Failed to load interview details");
    } finally {
      setIsLoading(false);
    }
  };

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

      if (parsed.title) setTitle(parsed.title);
      if (parsed.jdName) setJdName(parsed.jdName);
      if (parsed.interviewType) setInterviewType(parsed.interviewType);
      if (parsed.duration) setDuration(parsed.duration);

      toast.success("Job description analyzed! Form fields updated.");
    } catch (err: any) {
      console.error("Error parsing JD:", err);
      setError(err.message || "Failed to parse job description.");
      toast.error(err.message || "Failed to parse job description");
    } finally {
      setIsParsingJD(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) throw new Error("Interview title is required");
      if (!jdName.trim()) throw new Error("Job description name is required");

      let jdFileUrl: string | undefined;
      if (jdFile) {
        toast.info("Uploading new job description file...");
        jdFileUrl = await uploadJobDescription(jdFile, interviewId);
      }

      toast.info("Updating interview...");
      await updateInterview(interviewId, {
        title: title.trim(),
        jd_name: jdName.trim(),
        jd_text: jdMethod === "paste" ? jdText.trim() : undefined,
        jd_file_url: jdFileUrl,
        interview_type: interviewType || undefined,
        duration: duration ? parseInt(duration) : undefined,
        min_resume_score: minResumeScore,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        status: status,
      });

      toast.success("Interview updated successfully!");
      setShowSuccess(true);

      setTimeout(() => {
        router.push("/admin/interviews");
      }, 2000);
    } catch (err: any) {
      console.error("Error updating interview:", err);
      setError(err.message || "Failed to update interview.");
      toast.error(err.message || "Failed to update interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading interview details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/interviews">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Interview</h1>
          <p className="text-muted-foreground">Modify interview settings and job description</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Interview updated successfully. Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {mounted && (
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="jd-name">Job Description Name *</Label>
                <Input
                  id="jd-name"
                  value={jdName}
                  onChange={(e) => setJdName(e.target.value)}
                  required
                />
              </div>
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
                    {isParsingJD ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <FileText className="h-3 w-3 mr-2" />}
                    {isParsingJD ? "Analyzing..." : "Auto-fill with AI"}
                  </Button>
                </div>
                <Textarea
                  id="jd-text"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="jd-file">Update JD File (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jd-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="flex-1"
                    onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  />
                  {jdFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleParseJD}
                      disabled={isParsingJD}
                    >
                      {isParsingJD ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <FileText className="h-3 w-3 mr-2" />}
                      Auto-fill
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interview-type">Interview Type</Label>
                {mounted && (
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Coding Round">Coding Round</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">Available Until (End Time)</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-resume-score">Minimum Resume Score (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="min-resume-score"
                    type="number"
                    min="0"
                    max="100"
                    value={minResumeScore}
                    onChange={(e) => setMinResumeScore(parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Required score for candidate eligibility.
                  </span>
                </div>
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
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
