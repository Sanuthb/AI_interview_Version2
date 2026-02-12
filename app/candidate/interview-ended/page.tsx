"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Home } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getCandidateByUserId } from "@/lib/services/candidates";

export default function InterviewEndedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMalpractice, setIsMalpractice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const candidate = await getCandidateByUserId(user.id);
        if (candidate?.malpractice || candidate?.interview_status === 'Locked') {
          setIsMalpractice(true);
        }
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [user]);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50 ">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isMalpractice ? (
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600 " />
              </div>
            ) : (
              <div className="p-4 bg-green-100  rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 " />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {isMalpractice ? "Interview Terminated" : "Interview Completed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            {isMalpractice
              ? "Your interview was terminated due to a violation of the proctoring rules (full-screen exit detected). Your account has been locked."
              : "Thank you for completing the interview. Your responses have been recorded and an analysis report is being generated."}
          </p>

          <Button 
            className="w-full" 
            variant={isMalpractice ? "destructive" : "default"}
            onClick={() => router.push("/candidate/dashboard")}
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
