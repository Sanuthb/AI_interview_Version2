"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  Briefcase,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/protected-route";
import { toast } from "sonner";

interface InterviewAssignment {
  id: string;
  name: string;
  usn: string;
  status: string;
  resume_score: number | null;
  resume_status: string;
  interview_status: string;
  manually_promoted: boolean;
  interview_id: string;
  interviews: {
    id: string;
    title: string;
    jd_name: string;
    interview_type: string;
    duration: number;
    status: string;
    created_at: string;
  };
}

function CandidateDashboardContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [interviews, setInterviews] = useState<InterviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all interviews for the student
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/candidate/my-interviews");
        
        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        
        if (data.success) {
          setInterviews(data.data || []);
          
          if (data.data.length === 0) {
            setError("No interviews assigned yet. Please contact your administrator.");
          }
        } else {
          throw new Error(data.error || "Failed to load interviews");
        }
      } catch (err: any) {
        console.error("Error fetching interviews:", err);
        setError(err.message || "Failed to load dashboard data");
        toast.error("Failed to load interviews");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [user]);

  const getInterviewStatus = (assignment: InterviewAssignment) => {
    if (assignment.interview_status === "Completed") {
      return "Completed";
    }
    if (assignment.status === "Promoted" || assignment.manually_promoted) {
      return "Eligible";
    }
    if (assignment.status === "Not Promoted") {
      return "Not Eligible";
    }
    if (assignment.resume_score !== null && assignment.resume_score >= 75) {
      return "Eligible";
    }
    if (assignment.resume_score !== null && assignment.resume_score < 75) {
      return "Not Eligible";
    }
    return "Pending";
  };

  const canTakeInterview = (assignment: InterviewAssignment) => {
    return (
      assignment.status === "Promoted" ||
      assignment.manually_promoted ||
      (assignment.resume_score !== null && assignment.resume_score >= 75)
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Interviews</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name || user?.email} ({user?.usn || "N/A"})
        </p>
      </div>

      {error && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {interviews.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((assignment) => {
            const status = getInterviewStatus(assignment);
            const canTake = canTakeInterview(assignment);

            return (
              <Card key={`${assignment.id}-${assignment.interviews.id}`} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle 
                        className="text-lg line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                        onClick={() => router.push(`/candidate/interview-details/${assignment.interviews.id}`)}
                      >
                        {assignment.interviews.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.interviews.jd_name}
                      </p>
                    </div>
                    <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    {assignment.interviews.interview_type && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">
                          {assignment.interviews.interview_type}
                        </span>
                      </div>
                    )}
                    {assignment.interviews.duration && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {assignment.interviews.duration} min
                        </span>
                      </div>
                    )}
                    {assignment.resume_score !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Resume Score:</span>
                        <span className="font-medium">
                          {assignment.resume_score}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          status === "Eligible" || status === "Completed"
                            ? "default"
                            : status === "Not Eligible"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-col">
                    {!canTake && (<Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push(`/candidate/interview-details/${assignment.interviews.id}`)}
                    >
                      View Details
                    </Button>)
          }
                    {canTake && (
                       <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => router.push(`/interview/${assignment.interviews.id}`)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Start Interview
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && interviews.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Interviews Yet</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to any interviews yet. Please contact your
              administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CandidateDashboardPage() {
  return (
    <ProtectedRoute>
      <CandidateDashboardContent />
    </ProtectedRoute>
  );
}
