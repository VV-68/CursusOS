const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKETS = {
  FACULTY_UPLOAD: 'faculty_upload',
  SUBMISSIONS: 'assignment-submissions',
};

const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const uploadToBucket = async (bucket, path, fileBuffer, mimeType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed (${bucket}): ${error.message}`);
  return { path: data.path };
};

const getSignedUrlFromBucket = async (bucket, filePath, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw new Error(`Signed URL failed (${bucket}): ${error.message}`);
  return data.signedUrl;
};

const deleteFromBucket = async (bucket, filePaths) => {
  const paths = (Array.isArray(filePaths) ? filePaths : [filePaths]).filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`Storage delete failed (${bucket}): ${error.message}`);
};

const deleteFolderPrefix = async (bucket, prefix) => {
  const { data: files, error: listErr } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (listErr) throw new Error(`Storage list failed (${bucket}): ${listErr.message}`);
  if (!files?.length) return;

  const paths = files
    .filter((f) => f.name)
    .map((f) => `${prefix}/${f.name}`.replace(/\/+/g, '/'));

  if (paths.length) await deleteFromBucket(bucket, paths);
};

// ── Assignment question PDFs ─────────────────────────────────────────────────
const uploadQuestionPdf = async (assignmentId, fileBuffer, originalName, mimeType) => {
  const path = `questions/${assignmentId}/${Date.now()}_${sanitizeName(originalName)}`;
  return uploadToBucket(BUCKETS.FACULTY_UPLOAD, path, fileBuffer, mimeType);
};

const getQuestionSignedUrl = (filePath, expiresIn = 3600) =>
  getSignedUrlFromBucket(BUCKETS.FACULTY_UPLOAD, filePath, expiresIn);

const deleteQuestionFile = (filePath) => deleteFromBucket(BUCKETS.FACULTY_UPLOAD, filePath);

// ── Student submissions ──────────────────────────────────────────────────────
const uploadSubmission = async (assignmentId, studentId, fileBuffer, originalName, mimeType) => {
  const path = `submissions/${assignmentId}/${studentId}/${Date.now()}_${sanitizeName(originalName)}`;
  const { path: stored } = await uploadToBucket(BUCKETS.SUBMISSIONS, path, fileBuffer, mimeType);
  return { path: stored };
};

const getSubmissionSignedUrl = (filePath, expiresIn = 3600) =>
  getSignedUrlFromBucket(BUCKETS.SUBMISSIONS, filePath, expiresIn);

const deleteSubmissionFile = (filePath) => deleteFromBucket(BUCKETS.SUBMISSIONS, filePath);

const deleteAssignmentSubmissionsPrefix = async (assignmentId) => {
  await deleteFolderPrefix(BUCKETS.SUBMISSIONS, `submissions/${assignmentId}`);
};

// ── Study materials ──────────────────────────────────────────────────────────
const uploadStudyMaterial = async (courseAssignmentId, materialId, fileBuffer, originalName, mimeType) => {
  const path = `materials/${courseAssignmentId}/${materialId}/${Date.now()}_${sanitizeName(originalName)}`;
  return uploadToBucket(BUCKETS.FACULTY_UPLOAD, path, fileBuffer, mimeType);
};

const getMaterialSignedUrl = (filePath, expiresIn = 3600) =>
  getSignedUrlFromBucket(BUCKETS.FACULTY_UPLOAD, filePath, expiresIn);

const deleteMaterialFile = (filePath) => deleteFromBucket(BUCKETS.FACULTY_UPLOAD, filePath);

module.exports = {
  supabase,
  BUCKETS,
  uploadQuestionPdf,
  getQuestionSignedUrl,
  deleteQuestionFile,
  uploadSubmission,
  getSubmissionSignedUrl,
  deleteSubmissionFile,
  deleteAssignmentSubmissionsPrefix,
  uploadStudyMaterial,
  getMaterialSignedUrl,
  deleteMaterialFile,
  deleteFromBucket,
};
