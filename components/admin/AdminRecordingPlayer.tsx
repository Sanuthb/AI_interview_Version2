import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, AlertTriangle } from "lucide-react";
import { RECORDING_BUCKET } from "@/lib/services/recording";

interface AdminRecordingPlayerProps {
  interviewId: string;
  candidateId: string;
  candidateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminRecordingPlayer({
  interviewId,
  candidateId,
  candidateName,
  open,
  onOpenChange,
}: AdminRecordingPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && interviewId && candidateId) {
      fetchRecordingChunks();
    }
  }, [open, interviewId, candidateId]);

  const fetchRecordingChunks = async () => {
    setLoading(true);
    setError(null);
    setChunks([]);

    try {
        // List files in the candidate's folder
        const folderPath = `${interviewId}/${candidateId}`;
        console.log("Fetching recordings from:", folderPath);

        const { data, error } = await supabase.storage
            .from(RECORDING_BUCKET)
            .list(folderPath, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
            });

        if (error) {
            console.error("Error listing files:", error);
            setError("Failed to load recording files.");
            return;
        }

        if (!data || data.length === 0) {
            setError("No recording found for this candidate.");
            return;
        }

        // Generate signed URLs for all chunks
        const urls: string[] = [];
        for (const file of data) {
            if (file.name.endsWith(".webm")) {
                const { data: signedData } = await supabase.storage
                    .from(RECORDING_BUCKET)
                    .createSignedUrl(`${folderPath}/${file.name}`, 3600); // 1 hour expiry
                
                if (signedData?.signedUrl) {
                    urls.push(signedData.signedUrl);
                }
            }
        }

        setChunks(urls);
    } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred while loading recordings.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Recording: {candidateName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Loading recording chunks...</p>
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center justify-center py-8 text-destructive bg-destructive/10 rounded-lg gap-2">
                    <AlertTriangle className="w-8 h-8" />
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && chunks.length > 0 && (
                <div className="grid gap-4">
                    <div className="bg-black/90 p-1 rounded-lg aspect-video flex items-center justify-center">
                        {/* 
                           For a truly seamless experience, we'd need to stitch these or use MSE.
                           For this MVP, we will list them or play the first one/sequentially.
                           A simple approach for review is to show a playlist.
                        */}
                        <video controls className="w-full h-full" src={chunks[0]}>
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    
                    <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Chunks ({chunks.length})</p>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                            {chunks.map((url, i) => (
                                <Button 
                                    key={i} 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        const video = document.querySelector('video');
                                        if (video) {
                                            video.src = url;
                                            video.play();
                                        }
                                    }}
                                >
                                    Part {i + 1}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            * Click a part to play specific segment.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
