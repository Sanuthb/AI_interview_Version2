"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/contexts/auth-context";
import axios from "axios";

export default function CandidateDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // console.log(session);

  const { candidateId } = useAuth();
  console.log("candidateId=", candidateId);

  useEffect(() => {
    const fetchInterviews = async () => {
      const res = await axios.post("/api/inngestApis/analysisFunction", {
        candidateId,
        conversation: "",
        interviewId: ""
      })
      console.log("res==>", res.data)
    };
    fetchInterviews();
  }, [candidateId])

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {session.user.name}
                </p>
                <p>
                  <strong>USN:</strong> {session.user.usn}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p>
                  <strong>Batch:</strong> {session.user.batch}
                </p>
                <p>
                  <strong>Department:</strong> {session.user.dept}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Status</CardTitle>
              <CardDescription>Your current interview progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-yellow-600">Pending</span>
                </p>
                <p>
                  <strong>Next Step:</strong> Complete your profile
                </p>
                <Button className="mt-4">Start Interview</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
