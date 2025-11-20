import { prisma } from '../../../core/db/prisma';


export const createDocument = async (title: string, ownerId: string) => {
  return prisma.document.create({
    data: {
      title,
      ownerId,
    },
  });
};

export const getDocumentById = async (id: string) => {
  return prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      permissions: true,
    },
  });
};

export const updateDocumentTitle = async (id: string, title: string) => {
  return prisma.document.update({
    where: { id },
    data: { title },
  });
};