"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2 } from "lucide-react";
import { updateCandidateStatus } from "@/lib/services/candidates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PromoteCandidateButton({ candidateId }: { candidateId: string }) {
  const [isPromoting, setIsPromoting] = useState(false);
  const router = useRouter();

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      await updateCandidateStatus(candidateId, "Promoted");
      toast.success("Candidate promoted successfully!");
      router.refresh();
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

