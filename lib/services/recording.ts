import { supabase } from "@/lib/supabase/client";

export const RECORDING_BUCKET = "interview-recordings";

export async function uploadRecordingChunk(
  interviewId: string,
  candidateId: string,
  chunkIndex: number,
  blob: Blob
): Promise<{ path: string; error: any }> {
  // Path format: interviewId/candidateId/chunk-001.webm
  const filename = `chunk-${String(chunkIndex).padStart(3, "0")}.webm`;
  const path = `${interviewId}/${candidateId}/${filename}`;

  const { data, error } = await supabase.storage
    .from(RECORDING_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: "video/webm",
    });

  return { path: data?.path || "", error };
}

export async function initializeRecordingMetadata(
  interviewId: string,
  candidateId: string
): Promise<{ id: string | null; error: any }> {
  const { data, error } = await supabase
    .from("recording_metadata")
    .insert({
      interview_id: interviewId,
      candidate_id: candidateId,
      start_time: new Date().toISOString(),
      total_chunks: 0,
      verification_status: "Pending",
    })
    .select("id")
    .single();

  return { id: data?.id || null, error };
}

export async function finalizeRecordingMetadata(
  metadataId: string,
  totalChunks: number,
  durationSeconds: number
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("recording_metadata")
    .update({
      total_chunks: totalChunks,
      duration_seconds: durationSeconds,
      end_time: new Date().toISOString(),
    })
    .eq("id", metadataId);

  return { error };
}
