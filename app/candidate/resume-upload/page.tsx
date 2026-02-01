"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle2, XCircle, FileText, Loader2, Briefcase } from "lucide-react";
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
  const [applications, setApplications] = useState<any[]>([]); 
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [skillsScore, setSkillsScore] = useState<number | null>(null);
  const [projectsScore, setProjectsScore] = useState<number | null>(null);
  const [experienceScore, setExperienceScore] = useState<number | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
      setScore(null);
      setSkillsScore(null);
      setProjectsScore(null);
      setExperienceScore(null);
      setEligible(null);
      setError(null);
    }
  };

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
      // Use fetchedCandidateId instead of context candidateId
      const resumeUrl = await uploadResumeFile(file, fetchedCandidateId);

      // Call backend AI resume analysis (LangChain + Gemini)
      toast.info("Analyzing resume with AI...");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Failed to analyze resume";
        throw new Error(message);
      }

      const result = await response.json();
      const analysis = result.data as {
        skillsMatchScore: number;
        projectRelevanceScore: number;
        experienceSuitabilityScore: number;
        overallScore: number;
        overallRating: string;
        resumeText?: string;
      };

      const overallScore = analysis.overallScore ?? 0;
      const isEligible = overallScore >= 75;

      const resumeText = analysis.resumeText;

      // Update candidate record using fetchedCandidateId AND interviewId
      await updateCandidateResume(
        fetchedCandidateId,
        resumeUrl,
        overallScore,
        resumeText,
        analysis,
        interviewId 
      );

      setScore(overallScore);
      setSkillsScore(analysis.skillsMatchScore ?? null);
      setProjectsScore(analysis.projectRelevanceScore ?? null);
      setExperienceScore(analysis.experienceSuitabilityScore ?? null);
      setEligible(isEligible);
      setUploaded(true);
      
      // Update local state for the selected application to reflect changes immediately
      setApplications(prev => prev.map(app => 
        app.interviews.id === interviewId 
          ? { ...app, resume_score: overallScore, status: isEligible ? "Promoted" : "Not Promoted" } 
          : app
      ));

      toast.success("Resume uploaded and analyzed successfully!");
      
      if (interviewIdParam) {
          // Delay briefly then go back to details
          setTimeout(() => {
              router.push(`/candidate/interview-details/${interviewIdParam}`);
          }, 1500);
      }

    } catch (err: any) {
      console.error("Error uploading resume:", err);
      setError(err.message || "Failed to upload resume. Please try again.");
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
                  const app = applications.find(a => a.interviews.id === value);
                  if (app && app.resume_score) {
                    setScore(app.resume_score);
                    setEligible(app.resume_score >= 75);
                    setUploaded(true); 
                  } else {
                    setUploaded(false);
                    setScore(null);
                    setEligible(null);
                  }
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
                disabled={isProcessing}
                className="flex-1"
              />
            </div>
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

          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing || !fetchedCandidateId}
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
                Upload & Analyze
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploaded && score !== null && eligible !== null && (
        <>
          {/* AI Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Resume Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Resume Match Score
                  </span>
                  <span className="text-2xl font-bold">{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>

              {skillsScore !== null ||
                projectsScore !== null ||
                experienceScore !== null ? (
                <div className="grid gap-2 text-sm">
                  {skillsScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Skills Match
                      </span>
                      <span className="font-medium">{skillsScore}%</span>
                    </div>
                  )}
                  {projectsScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Project Relevance
                      </span>
                      <span className="font-medium">{projectsScore}%</span>
                    </div>
                  )}
                  {experienceScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Experience Suitability
                      </span>
                      <span className="font-medium">{experienceScore}%</span>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Eligibility Status */}
          <Alert
            className={
              eligible
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-red-500 bg-red-50 dark:bg-red-950"
            }
          >
            {eligible ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle
              className={
                eligible
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }
            >
              {eligible ? "Eligible" : "Not Eligible"}
            </AlertTitle>
            <AlertDescription
              className={
                eligible
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }
            >
              {eligible
                ? "Congratulations! Your resume meets the requirements. You are eligible to proceed with the interview."
                : "Your resume score is below the threshold (75%). Please update your resume and try again."}
            </AlertDescription>
          </Alert>

          {/* Eligibility Badge */}
          <div className="flex flex-col items-center gap-4">
            <Badge
              variant={eligible ? "default" : "destructive"}
              className="text-lg px-6 py-2"
            >
              {eligible ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Eligible for Interview
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Not Eligible
                </>
              )}
            </Badge>

            {eligible && (
              <Button
                size="lg"
                onClick={handleTakeInterview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Take Interview
              </Button>
            )}
          </div>
        </>
      )}
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
