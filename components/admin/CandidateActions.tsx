// 'use client';

// import { PlayCircle } from "lucide-react";
// import { AdminRecordingPlayer } from "./AdminRecordingPlayer";

// // ... inside component

//   const [showResume, setShowResume] = useState(false);
//   const [showRecording, setShowRecording] = useState(false);
//   const interviewId = candidate.interview_ids?.[0] || "";

// // ... inside DropdownMenuContent
//           <DropdownMenuItem onClick={() => setShowResume(true)}>
//             <FileText className="mr-2 h-4 w-4" />
//             View Resume
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => setShowRecording(true)}>
//             <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
//             View Recording
//           </DropdownMenuItem>
//           <DropdownMenuSeparator />

// // ... inside render return (near ResumeViewer)
//       {showResume && (
//         <ResumeViewer
//           candidate={candidate}
//           open={showResume}
//           onOpenChange={setShowResume}
//         />
//       )}

//       {showRecording && (
//         <AdminRecordingPlayer
//           interviewId={interviewId}
//           candidateId={candidate.id}
//           candidateName={candidate.name}
//           open={showRecording}
//           onOpenChange={setShowRecording}
//         />
//       )}
//     </>
//   );
// }

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  FileText,
  CheckCircle,
  Ban,
  Clock,
  Lock,
} from "lucide-react";
import { Candidate } from "@/lib/types";
import { ResumeViewer } from "./ResumeViewer";
import {
  promoteCandidateAction,
  lockCandidateAction,
  reEnableCandidateAction,
  generateReportAction,
} from "@/app/admin/actions";
import { toast } from "sonner";
import { FileBadge } from "lucide-react";

interface CandidateActionsProps {
  candidate: Candidate;
}

export function CandidateActions({ candidate }: CandidateActionsProps) {
  console.log("candidate=", candidate);
  const [showResume, setShowResume] = useState(false);
  const interviewId = candidate.interview_ids?.[0] || "";

  const handlePromote = async () => {
    const result = await promoteCandidateAction(candidate.id, interviewId);
    if (result.success) toast.success("Candidate promoted");
    else toast.error("Failed to promote");
  };

  const handleReEnable = async () => {
    const result = await reEnableCandidateAction(candidate.id, interviewId, 24);
    if (result.success) toast.success("Interview re-enabled for 24h");
    else toast.error("Failed to re-enable");
  };

  const handleLock = async () => {
    const result = await lockCandidateAction(candidate.id, interviewId);
    if (result.success) toast.success("Candidate locked");
    else toast.error("Failed to lock");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowResume(true)}>
            <FileText className="mr-2 h-4 w-4" />
            View Resume
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePromote}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Promote to Next Round
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleReEnable}>
            <Clock className="mr-2 h-4 w-4 text-blue-600" />
            Re-Enable Interview
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              toast.info("Generating Report...");
              const res = await generateReportAction(candidate.id, interviewId);
              if (res.success)
                toast.success("Report Generated (Saved to Logs)");
              else toast.error("Failed");
            }}
          >
            <FileBadge className="mr-2 h-4 w-4 text-purple-600" />
            Generate AI Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLock}>
            <Ban className="mr-2 h-4 w-4" />
            Block / Lock
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showResume && (
        <ResumeViewer
          candidate={candidate}
          open={showResume}
          onOpenChange={setShowResume}
        />
      )}
    </>
  );
}
