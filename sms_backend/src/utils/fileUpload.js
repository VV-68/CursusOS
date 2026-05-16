const multer = require('multer');

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const createUpload = (maxSizeMb = 20) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
      else cb(new Error('File type not allowed'), false);
    },
  });

const uploadSingle = (field = 'file', maxSizeMb = 20) =>
  createUpload(maxSizeMb).single(field);

const uploadFields = (fields, maxSizeMb = 20) =>
  createUpload(maxSizeMb).fields(fields);

module.exports = { ALLOWED_MIMES, createUpload, uploadSingle, uploadFields };
