import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const uploadEvidence = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Bukti harus berupa JPG, PNG, atau PDF.') as Error & { statusCode?: number };
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

export default uploadEvidence;
