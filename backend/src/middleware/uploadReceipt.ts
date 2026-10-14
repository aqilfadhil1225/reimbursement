import multer from 'multer';

const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Bukti harus berupa JPG, PNG, atau PDF.') as Error & { statusCode?: number };
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

export default uploadReceipt;
