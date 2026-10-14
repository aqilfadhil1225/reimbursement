import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getMinioConfig } from './index';

let client: S3Client | undefined;

export const getMinioClient = () => {
  if (!client) {
    const minio = getMinioConfig();
    client = new S3Client({
      endpoint: `${minio.useSSL ? 'https' : 'http'}://${minio.endpoint}:${minio.port}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: minio.accessKey,
        secretAccessKey: minio.secretKey,
      },
    });
  }

  return client;
};

const isMissingBucketError = (error: unknown) =>
  error instanceof S3ServiceException
  && (error.$metadata.httpStatusCode === 404 || error.name === 'NoSuchBucket' || error.name === 'NotFound');

const isBucketAlreadyOwnedError = (error: unknown) =>
  error instanceof S3ServiceException && error.name === 'BucketAlreadyOwnedByYou';

export const ensureMinioBucket = async () => {
  const { bucket } = getMinioConfig();
  const minioClient = getMinioClient();

  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (!isMissingBucketError(error)) throw error;

    try {
      await minioClient.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (createError) {
      if (!isBucketAlreadyOwnedError(createError)) throw createError;
    }
  }
};

