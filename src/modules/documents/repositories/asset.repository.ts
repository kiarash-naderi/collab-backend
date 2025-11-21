import { prisma } from '../../../core/db/prisma.js';

export const createAsset = async (data: {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadedBy: string;
}) => {
  return prisma.binaryAsset.create({ data });
};

export const getAssetById = async (assetId: string) => {
  return prisma.binaryAsset.findUnique({
    where: { id: assetId },
    include: { document: true },
  });
};

export const deleteAssetById = async (assetId: string) => {
  return prisma.binaryAsset.delete({ where: { id: assetId } });
};

export const getAssetsByDocumentId = async (documentId: string) => {
  return prisma.binaryAsset.findMany({
    where: { documentId },
    orderBy: { uploadedAt: 'desc' },
  });
};