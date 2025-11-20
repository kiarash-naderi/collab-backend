
import { Request, Response } from "express";
import { listVersions, revertToVersion } from "../services/version.service.js";

export const getVersions = async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const versions = await listVersions(documentId);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch versions" });
  }
};

export const revertVersion = async (req: Request, res: Response) => {
  const { documentId, versionId } = req.params;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await revertToVersion(documentId, versionId, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Revert failed" });
  }
};