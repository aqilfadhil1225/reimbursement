const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:5173';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getMinioConfig = () => {
  const requiredVariables = [
    'MINIO_ENDPOINT',
    'MINIO_PORT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_BUCKET',
    'MINIO_USE_SSL',
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

  if (missingVariables.length) {
    throw new Error(`MinIO configuration is incomplete. Set: ${missingVariables.join(', ')}.`);
  }

  const readRequired = (name: string) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`MinIO configuration is missing ${name}.`);
    return value;
  };
  const endpoint = readRequired('MINIO_ENDPOINT');
  if (endpoint.includes('://') || endpoint.includes('/')) {
    throw new Error('MINIO_ENDPOINT must be a hostname or IP address without a scheme or path.');
  }

  const port = Number(readRequired('MINIO_PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('MINIO_PORT must be an integer between 1 and 65535.');
  }

  const useSSLValue = readRequired('MINIO_USE_SSL').toLowerCase();
  if (useSSLValue !== 'true' && useSSLValue !== 'false') {
    throw new Error('MINIO_USE_SSL must be either "true" or "false".');
  }

  return {
    endpoint,
    port,
    accessKey: readRequired('MINIO_ACCESS_KEY'),
    secretKey: readRequired('MINIO_SECRET_KEY'),
    bucket: readRequired('MINIO_BUCKET'),
    useSSL: useSSLValue === 'true',
  };
};

export default {
  port: Number(process.env.PORT) || 3001,
  appName: 'Reimbursement API',
  corsOrigin: parseCorsOrigins(),
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
