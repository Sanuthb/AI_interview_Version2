"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2 } from "lucide-react";
import { promoteCandidateAction } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PromoteCandidateButton({ 
  candidateId, 
  interviewId 
}: { 
  candidateId: string;
  interviewId: string;
}) {
  const [isPromoting, setIsPromoting] = useState(false);
  const router = useRouter();

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      const result = await promoteCandidateAction(candidateId, interviewId);
      if (result.success) {
        toast.success("Candidate promoted successfully!");
        router.refresh();
      } else {
        throw new Error(result.error || "Failed to promote");
      }
    } catch (error: any) {
      console.error("Error promoting candidate:", error);
      toast.error(error.message || "Failed to promote candidate");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Button size="sm" onClick={handlePromote} disabled={isPromoting}>
      {isPromoting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <TrendingUp className="mr-2 h-4 w-4" />
      )}
      Promote
    </Button>
  );
}

