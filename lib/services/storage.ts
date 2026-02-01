import { supabase } from '@/lib/supabase/client';

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadResume(file: File, candidateId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${candidateId}-${Date.now()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;

  return uploadFile(file, 'resumes', filePath);
}

export async function uploadJobDescription(file: File, interviewId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${interviewId}-${Date.now()}.${fileExt}`;
  const filePath = `job-descriptions/${fileName}`;

  return uploadFile(file, 'job-descriptions', filePath);
}

