"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowLeft,
  Calendar,
  Building,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { getInterviewsForUSN } from "@/lib/services/candidates";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

function InterviewDetailsContent({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.usn) return;

      try {
        const apps = await getInterviewsForUSN(user.usn);
        // Find the specific interview
        const match = apps.find((app) => app.interviews.id === interviewId);

        if (match) {
          setAssignment(match);
        } else {
          setError("Interview not found or you are not assigned to it.");
        }
      } catch (err: any) {
        console.error("Error fetching details:", err);
        setError("Failed to load interview details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [user, interviewId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Interview not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { interviews } = assignment;

  const canTakeInterview = (() => {
    const minScore = interviews.min_resume_score ?? 70;
    const isEligible = 
      (assignment.status !== "Not Promoted") && (
        assignment.status === "Promoted" ||
        assignment.manually_promoted ||
        (assignment.resume_score !== null && assignment.resume_score >= minScore)
      );
    
    if (!isEligible) return false;
    if (assignment.interview_status === "Completed") return false;
    if (assignment.interview_status === "Locked") return false;
    if (interviews.status === "Closed") return false;
    
    const now = new Date();
    if (interviews.start_time) {
      if (now < new Date(interviews.start_time)) return false;
    }
    
    if (interviews.end_time) {
      if (now > new Date(interviews.end_time)) return false;
    }

    return true;
  })();

  const now = new Date();
  const isStarted = !interviews.start_time || now >= new Date(interviews.start_time);
  const isExpired = interviews.end_time && now > new Date(interviews.end_time);
  const isClosed = interviews.status === "Closed";

  const statusText = (() => {
    if (assignment.interview_status === "Completed") return "Completed";
    if (isClosed) return "Interview Closed";
    if (!isStarted) return "Not Started";
    if (isExpired) return "Expired";
    if (assignment.interview_status === "Locked") return "Locked";
    if (assignment.status === "Not Promoted") return "Not Eligible";
    
    const minScore = interviews.min_resume_score ?? 70;
    const meetsScore = assignment.resume_score !== null && assignment.resume_score >= minScore;
    const isPromoted = assignment.status === "Promoted" || assignment.manually_promoted;
    
    if (isPromoted || meetsScore) return "Eligible";
    if (assignment.resume_score !== null && !meetsScore) return "Not Eligible";
    return "Selection Pending";
  })();

  const statusVariant = (() => {
    if (statusText === "Eligible" || statusText === "Completed") return "default";
    if (statusText === "Not Eligible" || statusText === "Interview Closed" || statusText === "Expired" || statusText === "Locked") return "destructive";
    return "secondary";
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/candidate/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Interview Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Job Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">{interviews.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {interviews.jd_name}
                  </CardDescription>
                </div>
                <Badge variant={interviews.status === "Active" ? "default" : "secondary"}>
                  {interviews.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Type: {interviews.interview_type || "General"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {interviews.duration || 30} mins</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Posted: {new Date(interviews.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {interviews.jd_text || "No detailed description available."}
                  {interviews.jd_file_url && (
                     <div className="mt-4">
                        <a href={interviews.jd_file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <FileText className="h-4 w-4"/> View JD Document
                        </a>
                     </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusVariant}>
                  {statusText}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-sm text-muted-foreground">Resume Score</span>
                 <span className="font-bold">
                    {assignment.resume_score !== null ? `${assignment.resume_score}%` : "N/A"}
                 </span>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!canTakeInterview}
                  onClick={() => router.push(`/interview/${interviews.id}`)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {statusText === "Interview Closed" ? "Closed" : 
                   statusText === "Not Started" ? "Not Started" :
                   statusText === "Expired" ? "Expired" :
                   statusText === "Locked" ? "Locked" :
                   statusText === "Not Eligible" ? "Ineligible" : "Start Interview"}
                </Button>

                <div className="space-y-2">
                    <Button
                        className="w-full"
                        variant="outline"
                        disabled={isClosed}
                        onClick={() => router.push(`/candidate/resume-upload?interviewId=${interviews.id}`)}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {isClosed ? "Closed" : (assignment.resume_url ? "Re-upload Resume" : "Upload Resume")}
                    </Button>
                    {assignment.resume_score !== null && assignment.resume_score < (interviews.min_resume_score ?? 70) && (
                         <p className="text-xs text-destructive text-center">
                             Resume score too low for automatic eligibility.
                         </p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function InterviewDetailsPage({ params }: PageProps) {
  const { interviewId } = use(params);
  return (
    <ProtectedRoute>
      <InterviewDetailsContent interviewId={interviewId} />
    </ProtectedRoute>
  );
}
