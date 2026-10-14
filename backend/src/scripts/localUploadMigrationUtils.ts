import { createHash } from 'crypto';

export type MigrationKind = 'profile' | 'reimbursement' | 'expense' | 'payment';

export type UploadReference = {
  kind: MigrationKind;
  id: number;
  reimbursementId?: number;
  url: string;
  filename: string;
};

export const getLegacyFilename = (value: string | null | undefined, kind: MigrationKind) => {
  if (!value || !/^https?:\/\//i.test(value)) return null;

  let pathname: string;
  try {
    pathname = new URL(value).pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/uploads\/([^/]+)$/);
  if (!match) return null;

  let filename: string;
  try {
    filename = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  const pattern = kind === 'profile'
    ? /^profile-\d+-[a-f0-9]+\.(jpg|jpeg|png|webp)$/i
    : /^receipt-\d+-\d+\.(jpg|jpeg|png|pdf)$/i;

  return pattern.test(filename) ? filename : null;
};

export const getFileType = (contents: Buffer, kind: MigrationKind) => {
  if (contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff) {
    return { extension: '.jpg', contentType: 'image/jpeg' };
  }
  if (contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: '.png', contentType: 'image/png' };
  }
  if (contents.subarray(0, 4).toString('ascii') === 'RIFF' && contents.subarray(8, 12).toString('ascii') === 'WEBP') {
    return kind === 'profile' ? { extension: '.webp', contentType: 'image/webp' } : null;
  }
  if (kind !== 'profile' && contents.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { extension: '.pdf', contentType: 'application/pdf' };
  }
  return null;
};

export const buildObjectKey = (reference: UploadReference, contents: Buffer, extension: string) => {
  const digest = createHash('sha256').update(contents).digest('hex').slice(0, 32);
  switch (reference.kind) {
    case 'profile':
      return `profile-photos/${reference.id}/${digest}${extension}`;
    case 'reimbursement':
      return `reimbursement-receipts/${reference.id}/${digest}${extension}`;
    case 'expense':
      return `expense-receipts/${reference.reimbursementId}/${reference.id}/${digest}${extension}`;
    case 'payment':
      return `payment-proofs/${reference.reimbursementId}/${digest}${extension}`;
  }
};
