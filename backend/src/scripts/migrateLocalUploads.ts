import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/prisma';
import objectStorageService from '../services/objectStorageService';
import {
  buildObjectKey,
  getFileType,
  getLegacyFilename,
  type MigrationKind,
  type UploadReference,
} from './localUploadMigrationUtils';

type PreparedUpload = {
  reference: UploadReference;
  objectKey: string;
  contentType: string;
};

type LoadedUpload = PreparedUpload & {
  contents: Buffer;
};

const uploadsDirectory = path.resolve(__dirname, '../../uploads');
const APPLY_CHANGES = process.argv.includes('--apply');
const allowedArguments = new Set(['--apply', '--dry-run', '--help']);
const unexpectedArguments = process.argv.slice(2).filter((argument) => !allowedArguments.has(argument));

const collectReferences = async (): Promise<UploadReference[]> => {
  const [users, reimbursements, expenses, payments] = await Promise.all([
    prisma.user.findMany({ where: { avatarUrl: { not: null } }, select: { id: true, avatarUrl: true } }),
    prisma.reimbursement.findMany({ where: { receiptUrl: { not: '' } }, select: { id: true, receiptUrl: true } }),
    prisma.expense.findMany({ where: { receiptUrl: { not: null } }, select: { id: true, reimbursementId: true, receiptUrl: true } }),
    prisma.payment.findMany({ where: { proofUrl: { not: null } }, select: { reimbursementId: true, proofUrl: true } }),
  ]);

  const references: UploadReference[] = [];
  for (const user of users) {
    const filename = getLegacyFilename(user.avatarUrl, 'profile');
    if (filename) references.push({ kind: 'profile', id: user.id, url: user.avatarUrl!, filename });
  }
  for (const reimbursement of reimbursements) {
    const filename = getLegacyFilename(reimbursement.receiptUrl, 'reimbursement');
    if (filename) references.push({ kind: 'reimbursement', id: reimbursement.id, url: reimbursement.receiptUrl, filename });
  }
  for (const expense of expenses) {
    const filename = getLegacyFilename(expense.receiptUrl, 'expense');
    if (filename) {
      references.push({
        kind: 'expense',
        id: expense.id,
        reimbursementId: expense.reimbursementId,
        url: expense.receiptUrl!,
        filename,
      });
    }
  }
  for (const payment of payments) {
    const filename = getLegacyFilename(payment.proofUrl, 'payment');
    if (filename) {
      references.push({
        kind: 'payment',
        id: payment.reimbursementId,
        reimbursementId: payment.reimbursementId,
        url: payment.proofUrl!,
        filename,
      });
    }
  }
  return references;
};

const prepareUpload = async (reference: UploadReference): Promise<LoadedUpload> => {
  const contents = await fs.readFile(path.join(uploadsDirectory, reference.filename));
  const fileType = getFileType(contents, reference.kind);
  if (!fileType) {
    throw new Error('File signature is unsupported or does not match an allowed upload type.');
  }

  return {
    reference,
    contents,
    contentType: fileType.contentType,
    objectKey: buildObjectKey(reference, contents, fileType.extension),
  };
};

const updateReference = async ({ reference, objectKey }: PreparedUpload) => {
  switch (reference.kind) {
    case 'profile':
      return prisma.user.updateMany({
        where: { id: reference.id, avatarUrl: reference.url },
        data: { avatarUrl: objectKey },
      });
    case 'reimbursement':
      return prisma.reimbursement.updateMany({
        where: { id: reference.id, receiptUrl: reference.url },
        data: { receiptUrl: objectKey },
      });
    case 'expense':
      return prisma.expense.updateMany({
        where: { id: reference.id, receiptUrl: reference.url },
        data: { receiptUrl: objectKey },
      });
    case 'payment':
      return prisma.payment.updateMany({
        where: { reimbursementId: reference.id, proofUrl: reference.url },
        data: { proofUrl: objectKey },
      });
  }
};

const main = async () => {
  if (process.argv.includes('--help')) {
    console.log('Usage: npm run migrate:local-uploads -- [--dry-run | --apply]');
    console.log('Dry-run is the default. --apply copies valid referenced files to MinIO and updates database references.');
    return;
  }
  if (unexpectedArguments.length) {
    throw new Error(`Unsupported arguments: ${unexpectedArguments.join(', ')}`);
  }
  if (APPLY_CHANGES && process.argv.includes('--dry-run')) {
    throw new Error('Choose either --dry-run or --apply, not both.');
  }

  const references = await collectReferences();
  const prepared: PreparedUpload[] = [];
  const failures: Array<{ kind: MigrationKind; id: number; message: string }> = [];

  for (const reference of references) {
    try {
      const upload = await prepareUpload(reference);
      prepared.push({
        reference: upload.reference,
        objectKey: upload.objectKey,
        contentType: upload.contentType,
      });
    } catch (error) {
      failures.push({
        kind: reference.kind,
        id: reference.id,
        message: error instanceof Error ? error.message : 'Unknown file preparation error.',
      });
    }
  }

  console.log(`Mode: ${APPLY_CHANGES ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Referenced local files found: ${references.length}`);
  console.log(`Files ready to migrate: ${prepared.length}`);
  console.log(`Files skipped due to missing/invalid content: ${failures.length}`);

  if (failures.length) {
    for (const failure of failures) {
      console.error(`Skipped ${failure.kind} record ${failure.id}: ${failure.message}`);
    }
  }

  if (!APPLY_CHANGES) {
    console.log('No changes made. Run again with --apply to migrate the files reported as ready.');
    return;
  }

  let migrated = 0;
  for (const upload of prepared) {
    try {
      const currentUpload = await prepareUpload(upload.reference);
      if (currentUpload.objectKey !== upload.objectKey) {
        throw new Error('Local file changed after the migration dry-run.');
      }

      await objectStorageService.uploadObject(upload.objectKey, currentUpload.contents, upload.contentType);
      const result = await updateReference(upload);
      if (result.count === 1) {
        migrated += 1;
      } else {
        failures.push({
          kind: upload.reference.kind,
          id: upload.reference.id,
          message: 'Database reference changed during migration; local file was kept.',
        });
      }
    } catch (error) {
      failures.push({
        kind: upload.reference.kind,
        id: upload.reference.id,
        message: error instanceof Error ? error.message : 'Unknown migration error.',
      });
    }
  }

  console.log(`Database references migrated: ${migrated}/${prepared.length}`);
  console.log('Original local files were kept. If a database update fails after upload, the MinIO object may need manual cleanup.');
  console.log('Review the result before removing any local files manually.');
  if (failures.length) {
    for (const failure of failures) {
      console.error(`Migration issue for ${failure.kind} record ${failure.id}: ${failure.message}`);
    }
  }
  if (failures.length || migrated !== prepared.length) process.exitCode = 1;
};

main()
  .catch((error: unknown) => {
    console.error('Local upload migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
