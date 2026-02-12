"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileText, Loader2, Briefcase, Clock, XCircle } from "lucide-react";
import {
  updateCandidateResume,
  getCandidateById,
  getCandidateByUserId,
  getCandidateByUSN,
  getInterviewsForUSN,
} from "@/lib/services/candidates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadResume as uploadResumeFile } from "@/lib/services/storage";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { toast } from "sonner";

function ResumeUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewIdParam = searchParams.get("interviewId");

  const { user, loading } = useAuth();
  const [fetchedCandidateId, setFetchedCandidateId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [applications, setApplications] = useState<any[]>([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Locate the handleUpload function in app/candidate/resume-upload/page.tsx
const handleUpload = async () => {
  if (!file) {
    setError("Please select a resume file");
    return;
  }

  if (!fetchedCandidateId) {
    setError("No candidate profile linked. Please contact administrator.");
    return;
  }
  
  if (!interviewId) {
    setError("Please select an interview to upload for.");
    return;
  }

  setError(null);
  setIsProcessing(true);

  try {
    toast.info("Uploading resume...");
    const resumeUrl = await uploadResumeFile(file, fetchedCandidateId);

    toast.info("Analyzing resume with AI...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("candidate_name", user?.name || "");

    const response = await fetch("/api/parse-resume", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(result.error || "Failed to analyze resume");
    }

    const analysis = result.data;
    const overallScore = analysis.overallScore ?? 0;
    
    const currentApp = applications.find(app => app.interviews.id === interviewId);
    const threshold = currentApp?.interviews?.min_resume_score ?? 70;
    const isEligible = overallScore >= threshold;

    await updateCandidateResume(
      fetchedCandidateId,
      resumeUrl,
      overallScore,
      analysis.resumeText,
      analysis,
      interviewId 
    );

    toast.success("Resume uploaded and analyzed successfully!");
    
    // Direct redirect to details page where scores are displayed
    router.push(`/candidate/interview-details/${interviewId}`);

  } catch (err: any) {
    console.error("Error uploading resume:", err);
    setError(err.message || "Failed to upload resume.");
    toast.error(err.message || "Failed to upload resume");
  } finally {
    setIsProcessing(false);
  }
};

  useEffect(() => {
    const fetchCandidateData = async () => {
      // Prioritize USN as it's more stable than ID for lookups involved in deduplication
      if (user?.usn) {
        try {
          console.log("Fetching interviews by USN:", user.usn);
          // NEW: Get all interviews using the new service that queries candidate_interviews
          const apps = await getInterviewsForUSN(user.usn);
          
          if (apps && apps.length > 0) {
            console.log("Fetched applications:", apps);
            setApplications(apps);
            setFetchedCandidateId(apps[0].id); // All apps have same candidate ID
            
            // Logic for interview selection
            if (interviewIdParam) {
                const valid = apps.find(a => a.interviews.id === interviewIdParam);
                if (valid) {
                    setInterviewId(interviewIdParam);
                } else {
                    toast.error("Invalid Interview ID or not assigned.");
                }
            } else {
                if (!interviewId) {
                   setInterviewId(apps[0].interviews.id);
                }
            }
            return; 
          } else {
             console.log("No applications found by USN.");
          }
        } catch (err) {
          console.error("Error fetching by USN:", err);
        }
      }

      // Legacy fallback
      if (!user?.id) return;
      
      try {
        const data = await getCandidateByUserId(user.id);
        
        if (data) {
          console.log("Fetched candidate by User ID:", data);
          setFetchedCandidateId(data.id);
          if (data.usn) {
             const apps = await getInterviewsForUSN(data.usn);
             if (apps.length > 0) {
                setApplications(apps);
                setInterviewId(apps[0].interviews.id);
             }
          }
        } else {
          console.error("No candidate found for user:", user.id);
          setError("Candidate profile not found. Please contact support.");
        }
      } catch (err) {
        console.error("Error fetching candidate data:", err);
      }
    };

    fetchCandidateData();
  }, [user?.id, user?.usn, interviewIdParam]);

  const handleTakeInterview = () => {
    if (interviewId) {
      router.push(`/interview/${interviewId}`);
    } else {
      toast.error("Interview ID not found. Please contact administrator.");
    }
  };
  
  const appForContext = applications.find(a => a.interviews.id === interviewId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Resume</h1>
        <p className="text-muted-foreground">
          Upload your resume for AI-powered screening
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          
          {/* Selector: Show only if NO param and multiple apps */}
          {applications.length > 0 && !interviewIdParam && (
            <div className="space-y-2">
              <Label htmlFor="interview-select">Select Interview</Label>
              <Select
                value={interviewId || ""}
                  onValueChange={(value) => {
                    setInterviewId(value);
                  }}
              >
                <SelectTrigger id="interview-select">
                  <SelectValue placeholder="Select an interview" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.interviews.id} value={app.interviews.id}>
                      {app.interviews.title} ({app.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
           {/* Context Alert: Show if param exists (Locked mode) */}
            {interviewIdParam && appForContext && (
               <Alert className="bg-muted border-primary/20">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <AlertDescription className="flex items-center gap-2 ml-2">
                      Uploading for: <span className="font-semibold">{appForContext.interviews.title}</span>
                  </AlertDescription>
               </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="resume-file">Select Resume File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isProcessing || !!appForContext?.resume_score || appForContext?.interviews?.status === "Closed"}
                  className="flex-1"
                />
              </div>
              {!!appForContext?.resume_score && (
                <p className="text-sm text-amber-600 font-medium">
                  Resume attempt locked. You cannot re-upload for this interview.
                </p>
              )}
                {(appForContext?.interviews?.status === "Closed" || 
                  (appForContext?.interviews?.start_time && new Date() < new Date(appForContext.interviews.start_time)) ||
                  (appForContext?.interviews?.end_time && new Date() > new Date(appForContext.interviews.end_time))) && (
                <p className="text-sm text-destructive font-medium">
                  {appForContext?.interviews?.status === "Closed" ? "Interview closed." : 
                   (appForContext?.interviews?.start_time && new Date() < new Date(appForContext.interviews.start_time)) ? "Interview hasn't started yet." :
                   "Interview window has expired."} You cannot upload resumes at this time.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOC, DOCX (Max size: 5MB)
              </p>
            </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {appForContext?.interviews?.status === "Closed" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Interview Closed</AlertTitle>
              <AlertDescription>
                This interview has been closed by the administrator. You can no longer upload resumes or participate.
              </AlertDescription>
            </Alert>
          )}

          {appForContext?.interviews?.start_time && new Date() < new Date(appForContext.interviews.start_time) && (
            <Alert variant="default">
              <Clock className="h-4 w-4" />
              <AlertTitle>Interview Not Started</AlertTitle>
              <AlertDescription>
                This interview is scheduled to start on {new Date(appForContext.interviews.start_time).toLocaleString()}. Please return then to upload your resume.
              </AlertDescription>
            </Alert>
          )}

          {appForContext?.interviews?.end_time && new Date() > new Date(appForContext.interviews.end_time) && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Interview Expired</AlertTitle>
              <AlertDescription>
                The window for this interview has expired. You can no longer upload resumes.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={
              !file || 
              isProcessing || 
              !fetchedCandidateId || 
              (appForContext?.resume_score !== undefined && appForContext?.resume_score !== null) || 
              appForContext?.interviews?.status === "Closed" ||
              (appForContext?.interviews?.start_time && new Date() < new Date(appForContext.interviews.start_time)) ||
              (appForContext?.interviews?.end_time && new Date() > new Date(appForContext.interviews.end_time))
            }
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {(appForContext?.resume_score !== undefined && appForContext?.resume_score !== null) ? "Upload Locked" : "Upload & Analyze"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default function ResumeUploadPage() {
  return (
    <ProtectedRoute>
      <ResumeUploadContent />
    </ProtectedRoute>
  );
}
