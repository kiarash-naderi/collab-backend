import { v4 as uuidv4 } from 'uuid';
import { createAsset, getAssetById, deleteAssetById, getAssetsByDocumentId } from '../repositories/asset.repository.js';
import { requireDocumentRole } from './permissions.service.js';
import { minioClient, ensureBucket, BUCKET_NAME } from'../../../core/config/minio.client.js';
import { AppError } from '../../../utils/errors.js';

export const initAssetService = async () => {
  await ensureBucket();
};

export const uploadAsset = async (
  documentId: string,
  file: Express.Multer.File,
  uploadedBy: string
) => {
  await requireDocumentRole(documentId, uploadedBy, 'EDITOR');

  const fileId = uuidv4();
  const ext = file.originalname.split('.').pop() ?? 'bin';
  const key = `${documentId}/${fileId}.${ext}`;

  await minioClient.putObject(BUCKET_NAME, key, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });

  const url = await minioClient.presignedGetObject(BUCKET_NAME, key, 7 * 24 * 60 * 60); // 7 روز

  const asset = await createAsset({
    id: fileId,
    documentId,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storagePath: key,
    uploadedBy,
  });

  return {
    assetId: asset.id,
    url,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    uploadedAt: asset.uploadedAt,
  };
};

export const deleteAsset = async (assetId: string, userId: string) => {
  const asset = await getAssetById(assetId);
  if (!asset) throw new AppError('Asset not found', 404);

  const isOwner = asset.document.ownerId === userId;
  const isUploader = asset.uploadedBy === userId;

  if (!isOwner && !isUploader) {
    await requireDocumentRole(asset.documentId, userId, 'OWNER');
  }

  await minioClient.removeObject(BUCKET_NAME, asset.storagePath);
  await deleteAssetById(assetId);

  return { success: true };
};

export const listAssets = async (documentId: string, userId: string) => {
  await requireDocumentRole(documentId, userId, 'VIEWER');
  return getAssetsByDocumentId(documentId);
};