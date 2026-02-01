import { Loader2, Radio } from "lucide-react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  uploadQueue: number;
}

export function RecordingIndicator({
  isRecording,
  uploadQueue,
}: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-3 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-full">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </div>
      <span className="text-xs font-medium text-red-200">REC</span>
      
      {uploadQueue > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 border-l border-white/10 pl-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Syncing {uploadQueue}...
        </span>
      )}
    </div>
  );
}
