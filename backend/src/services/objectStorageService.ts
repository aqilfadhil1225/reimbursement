import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { ensureMinioBucket, getMinioClient } from '../config/minio';
import { getMinioConfig } from '../config';

const DEFAULT_URL_EXPIRY_SECONDS = 300;
const MAX_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

const validateObjectKey = (objectKey: string) => {
  if (
    !objectKey
    || Buffer.byteLength(objectKey, 'utf8') > 1024
    || objectKey.startsWith('/')
    || objectKey.includes('\\')
    || /[\u0000-\u001f\u007f]/.test(objectKey)
    || objectKey.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Object key must be a valid relative S3 key.');
  }
};

const isProfilePhotoObjectKey = (objectKey: string, userId: number) =>
  new RegExp(`^profile-photos/${userId}/[a-f0-9]{32}\\.(jpg|png|webp)$`).test(objectKey);

const isReceiptObjectKey = (objectKey: string) =>
  /^reimbursement-receipts\/[1-9]\d*\/[a-f0-9]{32}\.(jpg|png|pdf)$/.test(objectKey)
  || /^expense-receipts\/[1-9]\d*\/[1-9]\d*\/[a-f0-9]{32}\.(jpg|png|pdf)$/.test(objectKey);

const isValidEvidenceFile = (file: { buffer: Buffer; mimetype: string }) => {
  const { buffer, mimetype } = file;
  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
};

const uploadObject = async (
  objectKey: string,
  body: Buffer | Uint8Array | Readable,
  contentType: string,
) => {
  validateObjectKey(objectKey);
  if (!contentType.trim()) {
    throw new Error('Content type is required when uploading an object.');
  }

  const { bucket } = getMinioConfig();
  const client = getMinioClient();
  await ensureMinioBucket();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
  }));

  return objectKey;
};

const createObjectUrl = async (
  objectKey: string,
  expiresIn = DEFAULT_URL_EXPIRY_SECONDS,
) => {
  validateObjectKey(objectKey);
  if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > MAX_URL_EXPIRY_SECONDS) {
    throw new Error(`Presigned URL expiry must be between 1 and ${MAX_URL_EXPIRY_SECONDS} seconds.`);
  }

  const { bucket } = getMinioConfig();
  const client = getMinioClient();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
    { expiresIn },
  );
};

const formatReceiptUrl = (receiptUrl: string | null | undefined) => {
  if (typeof receiptUrl !== 'string' || !isReceiptObjectKey(receiptUrl)) return receiptUrl;
  return createObjectUrl(receiptUrl, 24 * 60 * 60);
};

const deleteObject = async (objectKey: string) => {
  validateObjectKey(objectKey);
  const { bucket } = getMinioConfig();
  const client = getMinioClient();

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  }));
};

export default {
  uploadObject,
  createObjectUrl,
  formatReceiptUrl,
  deleteObject,
  isProfilePhotoObjectKey,
  isReceiptObjectKey,
  isValidEvidenceFile,
};
