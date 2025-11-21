import { Request, Response } from 'express';
import { uploadAsset, deleteAsset, listAssets } from '../services/asset.service.js';

export const handleUploadAsset = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentId = req.params.id;
    const userId = req.user!.userId; 

    const result = await uploadAsset(documentId, req.file, userId);
    res.json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    const message = err.message || 'Upload failed';
    res.status(status).json({ error: message });
  }
};

export const handleDeleteAsset = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const userId = req.user!.userId;

    await deleteAsset(assetId, userId);
    res.json({ success: true });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Delete failed' });
  }
};

export const handleListAssets = async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;

    const assets = await listAssets(documentId, userId);
    res.json(assets);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to list assets' });
  }
};