import { prisma } from '../../../core/db/prisma';
import type { Document } from '@prisma/client';

export const getDocumentById = async (id: string): Promise<Document | null> => {
  return prisma.document.findUnique({ where: { id } });
};

export const createDocument = async (title: string): Promise<Document> => {
  return prisma.document.create({ data: { title } });
};

export const updateDocumentTitle = async (id: string, title: string): Promise<Document> => {
  return prisma.document.update({ where: { id }, data: { title } });
};

export const deleteDocument = async (id: string): Promise<void> => {
  await prisma.document.delete({ where: { id } });
};