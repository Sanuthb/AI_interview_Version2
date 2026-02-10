import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Candidate } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import { getCandidatesByInterview } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { CandidateTable } from "@/components/admin/CandidateTable";
import { AddCandidateModal } from "@/components/admin/AddCandidateModal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ interviewId: string }>;
}

export default async function InterviewDashboardPage({ params }: PageProps) {
  const { interviewId } = await params;

  let interview = null;
  let candidates: Candidate[] = [];

  try {
    interview = await getInterviewById(interviewId);
    candidates = await getCandidatesByInterview(interviewId);
  } catch (error) {
    console.error("Error fetching interview data:", error);
  }

  const interviewTitle = interview?.title || "Interview Dashboard";
  const totalCandidates = candidates.length;
  const promotedCount = candidates.filter((c) => c.status === "Promoted").length;
  const completedCount = candidates.filter((c) => (c.resume_score || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/interviews" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">{interviewTitle}</h1>
          </div>
          <p className="text-muted-foreground">
            Interview results and candidate performance
          </p>
        </div>
        <AddCandidateModal interviewId={interviewId} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/40 backdrop-blur-md border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Registered for this interview
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promoted Candidates
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {promotedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCandidates > 0
                ? Math.round((promotedCount / totalCandidates) * 100)
                : 0}% promotion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interviews Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Out of {totalCandidates} candidates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Results Table */}
      <Card className="bg-card/40 backdrop-blur-md border-white/5">
        <CardHeader>
          <CardTitle>Candidate Results</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateTable candidates={candidates} interviewId={interviewId} />
        </CardContent>
      </Card>
    </div>
  );
}

