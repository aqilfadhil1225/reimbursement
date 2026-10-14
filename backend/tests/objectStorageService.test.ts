import assert from 'node:assert/strict';
import test from 'node:test';
import objectStorageService from '../src/services/objectStorageService';

test('validates MinIO object keys against the expected record scope', () => {
  assert.equal(objectStorageService.isProfilePhotoObjectKey(`profile-photos/7/${'a'.repeat(32)}.webp`, 7), true);
  assert.equal(objectStorageService.isProfilePhotoObjectKey(`profile-photos/8/${'a'.repeat(32)}.webp`, 7), false);
  assert.equal(objectStorageService.isReceiptObjectKey(`reimbursement-receipts/7/${'b'.repeat(32)}.pdf`), true);
  assert.equal(objectStorageService.isReceiptObjectKey(`expense-receipts/7/8/${'b'.repeat(32)}.jpg`), true);
  assert.equal(objectStorageService.isReceiptObjectKey(`payment-proofs/7/${'b'.repeat(32)}.pdf`), false);
  assert.equal(objectStorageService.isPaymentProofObjectKey(`payment-proofs/7/${'c'.repeat(32)}.png`), true);
  assert.equal(objectStorageService.isPaymentProofObjectKey(`payment-proofs/0/${'c'.repeat(32)}.png`), false);
});

test('validates evidence content signatures instead of trusting the MIME type', () => {
  assert.equal(objectStorageService.isValidEvidenceFile({
    buffer: Buffer.from([0xff, 0xd8, 0xff]),
    mimetype: 'image/jpeg',
  }), true);
  assert.equal(objectStorageService.isValidEvidenceFile({
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    mimetype: 'image/png',
  }), true);
  assert.equal(objectStorageService.isValidEvidenceFile({
    buffer: Buffer.from('%PDF-1.7'),
    mimetype: 'application/pdf',
  }), true);
  assert.equal(objectStorageService.isValidEvidenceFile({
    buffer: Buffer.from('not a pdf'),
    mimetype: 'application/pdf',
  }), false);
  assert.equal(objectStorageService.isValidEvidenceFile({
    buffer: Buffer.from('%PDF-1.7'),
    mimetype: 'image/jpeg',
  }), false);
});

test('rejects malformed object keys and invalid presigned URL expiries', async () => {
  await assert.rejects(
    objectStorageService.createObjectUrl('../private/file.pdf'),
    /valid relative S3 key/,
  );
  await assert.rejects(
    objectStorageService.createObjectUrl(`payment-proofs/1/${'d'.repeat(32)}.pdf`, 0),
    /expiry must be between/,
  );
  await assert.rejects(
    objectStorageService.createObjectUrl(`payment-proofs/1/${'d'.repeat(32)}.pdf`, 7 * 24 * 60 * 60 + 1),
    /expiry must be between/,
  );
});

test('keeps legacy receipt URLs unchanged', async () => {
  const legacyUrl = 'http://localhost:3001/uploads/receipt-1-2.png';
  assert.equal(await objectStorageService.formatReceiptUrl(legacyUrl), legacyUrl);
  assert.equal(await objectStorageService.formatReceiptUrl(null), null);
});
