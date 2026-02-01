import { useState, useRef, useCallback, useEffect } from "react";
import {
  uploadRecordingChunk,
  initializeRecordingMetadata,
  finalizeRecordingMetadata,
} from "@/lib/services/recording";
import { toast } from "sonner";

interface UseInterviewRecorderProps {
  interviewId: string;
  candidateId: string;
}

export function useInterviewRecorder({
  interviewId,
  candidateId,
}: UseInterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [metadataId, setMetadataId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(1); // 1-based index (chunk-001)
  const startTimeRef = useRef<number | null>(null);

  // Initialize stream permission
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: 15 }, // Low res/FPS for performance
        audio: true,
      });
      streamRef.current = stream;
      setPermissionGranted(true);
      return true;
    } catch (err) {
      console.error("Permission denied:", err);
      toast.error("Camera/Microphone permission required for recording.");
      return false;
    }
  };

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    try {
      // 1. Create DB entry
      const { id, error } = await initializeRecordingMetadata(
        interviewId,
        candidateId
      );
      if (error || !id) {
        throw new Error("Failed to initialize recording session.");
      }
      setMetadataId(id);

      // 2. Setup MediaRecorder
      const recorder = new MediaRecorder(streamRef.current!, {
        mimeType: "video/webm;codecs=vp8",
        videoBitsPerSecond: 500_000, // 0.5 Mbps limit
      });

      mediaRecorderRef.current = recorder;
      chunkIndexRef.current = 1;
      startTimeRef.current = Date.now();

      // 3. Handle Chunks
      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          const currentIndex = chunkIndexRef.current;
          chunkIndexRef.current += 1; // Increment for next chunk

          // Upload immediately (fire and forget with queue tracking)
          setUploadQueue((prev) => prev + 1);
          uploadRecordingChunk(interviewId, candidateId, currentIndex, event.data)
            .then(({ error }) => {
              if (error) console.error(`Chunk ${currentIndex} upload failed:`, error);
            })
            .finally(() => {
              setUploadQueue((prev) => prev - 1);
            });
        }
      };

      // 4. Start (5-second chunks)
      recorder.start(5000);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err: any) {
      toast.error(`Recording Error: ${err.message}`);
    }
  }, [interviewId, candidateId]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop stream tracks
      streamRef.current?.getTracks().forEach((track) => track.stop());

      // Calculate duration
      const durationSeconds = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      // Finalize DB entry
      if (metadataId) {
        await finalizeRecordingMetadata(
          metadataId,
          chunkIndexRef.current - 1,
          durationSeconds
        );
      }
      console.log("Recording stopped");
    }
  }, [isRecording, metadataId]);

  return {
    isRecording,
    permissionGranted,
    requestPermissions,
    startRecording,
    stopRecording,
    uploadQueue, // Can be used to show "Syncing..." status
  };
}
