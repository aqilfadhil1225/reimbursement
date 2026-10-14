import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import multer from 'multer';

const uploadDirectory = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionsByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const uploadProfilePhoto = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = extensionsByMimeType[file.mimetype];
      callback(null, `profile-${Date.now()}-${randomBytes(8).toString('hex')}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!extensionsByMimeType[file.mimetype]) {
      const error = new Error('Foto profil harus berupa JPG, PNG, atau WebP.') as Error & { statusCode?: number };
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

export default uploadProfilePhoto;
