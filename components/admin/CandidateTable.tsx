'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Candidate } from "@/lib/types";
import { CandidateActions } from "./CandidateActions";
import { StatusBadge } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Search, AlertTriangle, ShieldCheck } from "lucide-react";

interface CandidateTableProps {
  candidates: Candidate[];
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.usn.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      c.status.toLowerCase() === statusFilter.toLowerCase() ||
      c.interview_status.toLowerCase() === statusFilter.toLowerCase();

    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "high" && (c.resume_score || 0) >= 80) ||
      (scoreFilter === "mid" && (c.resume_score || 0) >= 50 && (c.resume_score || 0) < 80) ||
      (scoreFilter === "low" && (c.resume_score || 0) < 50);

    return matchesSearch && matchesStatus && matchesScore;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name or USN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="promoted">Promoted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resume Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Score</SelectItem>
              <SelectItem value="high">High (80%+)</SelectItem>
              <SelectItem value="mid">Mid (50-79%)</SelectItem>
              <SelectItem value="low">Low (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Resume Score</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Resume Status</TableHead>
              <TableHead>Interview Status</TableHead>
              <TableHead>Overrides</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No candidates found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => {
                // Malpractice Logic
                const isFlagged = candidate.malpractice || (candidate.malpractice_score || 0) >= 80;
                const isSuspicious = !isFlagged && (candidate.malpractice_score || 0) > 0;

                return (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">{candidate.usn}</div>
                    </TableCell>
                    <TableCell>
                      {candidate.resume_score ? (
                        <div className="w-[120px] space-y-1">
                          <Progress value={candidate.resume_score} className="h-2" />
                          <div className="text-xs text-muted-foreground text-right">{candidate.resume_score}%</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {candidate.risk_level === "HIGH" ? (
                        <div className="flex items-center gap-1.5 text-destructive font-bold bg-destructive/10 px-2 py-1 rounded w-fit" title="High Risk Behavior Detected">
                          <AlertTriangle size={14} />
                          High ({candidate.risk_score || 0})
                        </div>
                      ) : candidate.risk_level === "MEDIUM" ? (
                        <div className="flex items-center gap-1.5 text-yellow-600 font-bold bg-yellow-500/10 px-2 py-1 rounded w-fit" title="Suspicious Behavior">
                          <AlertTriangle size={14} />
                          Med ({candidate.risk_score || 0})
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-500/10 px-2 py-1 rounded w-fit">
                          <ShieldCheck size={14} />
                          Low ({candidate.risk_score || 0})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={candidate.resume_status} type="resume" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={candidate.interview_status} type="interview" />
                      {candidate.manual_interview_deadline && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Ext: {new Date(candidate.manual_interview_deadline).toLocaleTimeString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {candidate.manually_promoted && (
                        <StatusBadge status="Promoted" />
                      )}
                      {candidate.override_by_admin && (
                        <span className="text-xs border px-1 rounded ml-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                          Override
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <CandidateActions candidate={candidate} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground">
        Showing {filteredCandidates.length} of {candidates.length} candidates
      </div>
    </div>
  );
}
