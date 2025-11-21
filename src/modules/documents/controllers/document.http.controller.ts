import { Request, Response } from "express";
import { getVersions, revertToVersion } from "../services/version.service.js";
import { prisma } from "../../../core/db/prisma.js";
import * as Y from "yjs";
import { registerYDoc } from "../services/sync.service.js";

export const createDocument = async (req: Request, res: Response) => {
  const { title = "Untitled Document" } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const document = await prisma.document.create({
      data: {
        title,
        ownerId: userId,
      },
    });

    await prisma.documentPermission.create({
      data: {
        documentId: document.id,
        userId,
        role: 'OWNER',
      },
    });

    const ydoc = new Y.Doc();
    const initialUpdate = Y.encodeStateAsUpdate(ydoc);
    const initialStateVector = Y.encodeStateVector(ydoc);

    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        snapshot: Buffer.from(initialUpdate),
        stateVector: Buffer.from(initialStateVector),
        label: "Initial version",
        createdBy: userId,
      },
    });

    registerYDoc(document.id, ydoc);

    res.status(201).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Create document failed:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
};

export const getDocumentVersions = async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const versions = await getVersions(documentId);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch versions" });
  }
};

export const revertDocumentVersion = async (req: Request, res: Response) => {
  const { documentId, versionId } = req.params;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await revertToVersion(documentId, versionId, userId);
    res.json({ message: "Reverted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Revert failed" });
  }
};
