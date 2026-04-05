const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role key for backend — never use anon key here
);

const BUCKET = 'assignment-submissions';

/**
 * Upload a file buffer to Supabase Storage.
 * Path: submissions/{assignment_id}/{student_id}/{timestamp}_{filename}
 */
const uploadSubmission = async (assignmentId, studentId, fileBuffer, originalName, mimeType) => {
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `submissions/${assignmentId}/${studentId}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return { path: data.path, fullPath: data.fullPath };
};

/**
 * Generate a signed URL for a private file (valid for 1 hour).
 */
const getSignedUrl = async (filePath, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw new Error(`Signed URL generation failed: ${error.message}`);
  return data.signedUrl;
};

/**
 * Delete a file from storage (used when a submission is retracted).
 */
const deleteFile = async (filePath) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
};

module.exports = { uploadSubmission, getSignedUrl, deleteFile };
