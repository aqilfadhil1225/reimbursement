import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  buildObjectKey,
  getFileType,
  getLegacyFilename,
  type UploadReference,
} from '../src/scripts/localUploadMigrationUtils';

test('recognizes only supported legacy upload URLs for the requested record type', () => {
  assert.equal(
    getLegacyFilename('http://old-host/uploads/profile-13-a1b2c3.png?cache=1', 'profile'),
    'profile-13-a1b2c3.png',
  );
  assert.equal(
    getLegacyFilename('https://old-host/uploads/receipt-27-12345.pdf', 'expense'),
    'receipt-27-12345.pdf',
  );
  assert.equal(getLegacyFilename('https://external.test/profile.png', 'profile'), null);
  assert.equal(getLegacyFilename('https://external.test/uploads/receipt-27-12345.pdf', 'profile'), null);
  assert.equal(getLegacyFilename('https://external.test/uploads/receipt-27-12345.pdf/extra', 'payment'), null);
  assert.equal(getLegacyFilename('https://external.test/uploads/%2e%2e%2fsecret.png', 'profile'), null);
  assert.equal(getLegacyFilename('/uploads/profile-13-a1b2c3.png', 'profile'), null);
});

test('detects supported image and document signatures by upload kind', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Buffer.from('RIFFxxxxWEBP');
  const pdf = Buffer.from('%PDF-1.7');

  assert.deepEqual(getFileType(jpeg, 'profile'), { extension: '.jpg', contentType: 'image/jpeg' });
  assert.deepEqual(getFileType(png, 'expense'), { extension: '.png', contentType: 'image/png' });
  assert.deepEqual(getFileType(webp, 'profile'), { extension: '.webp', contentType: 'image/webp' });
  assert.equal(getFileType(webp, 'reimbursement'), null);
  assert.deepEqual(getFileType(pdf, 'payment'), { extension: '.pdf', contentType: 'application/pdf' });
  assert.equal(getFileType(pdf, 'profile'), null);
  assert.equal(getFileType(Buffer.from('not an image'), 'profile'), null);
});

test('generates deterministic object keys under the correct storage prefixes', () => {
  const contents = Buffer.from('same source file');
  const digest = createHash('sha256').update(contents).digest('hex').slice(0, 32);
  const references: Array<[UploadReference, string]> = [
    [{ kind: 'profile', id: 12, url: '', filename: '' }, `profile-photos/12/${digest}.png`],
    [{ kind: 'reimbursement', id: 34, url: '', filename: '' }, `reimbursement-receipts/34/${digest}.pdf`],
    [{ kind: 'expense', id: 56, reimbursementId: 34, url: '', filename: '' }, `expense-receipts/34/56/${digest}.jpg`],
    [{ kind: 'payment', id: 34, reimbursementId: 34, url: '', filename: '' }, `payment-proofs/34/${digest}.pdf`],
  ];

  for (const [reference, expectedKey] of references) {
    const extension = expectedKey.slice(expectedKey.lastIndexOf('.'));
    assert.equal(buildObjectKey(reference, contents, extension), expectedKey);
    assert.equal(buildObjectKey(reference, contents, extension), expectedKey);
  }
});
