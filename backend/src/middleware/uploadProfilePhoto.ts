import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Foto profil harus berupa JPG, PNG, atau WebP.') as Error & { statusCode?: number };
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

export default uploadProfilePhoto;
