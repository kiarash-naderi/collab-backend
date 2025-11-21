import { Client } from 'minio';  

import { env } from '../config/env.js';

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL === true,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const BUCKET_NAME = env.MINIO_BUCKET;

export const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`MinIO bucket "${BUCKET_NAME}" created`);
    } else {
      console.log(`MinIO bucket "${BUCKET_NAME}" already exists`);
    }
  } catch (err) {
    console.error('Failed to ensure MinIO bucket:', err);
    throw err;
  }
};