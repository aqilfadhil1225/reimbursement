const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const uploadReceipt = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Bukti harus berupa JPG, PNG, atau PDF.'));
    }
    return callback(null, true);
  },
});

module.exports = uploadReceipt;