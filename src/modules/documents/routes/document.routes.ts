import { Router } from "express";
import { getDocumentVersions, revertDocumentVersion } from "../controllers/document.http.controller.js";
import {  requireAuth } from "../../../core/middleware/auth.middleware.js";
import { createDocument } from "../controllers/document.http.controller.js";
import multer from 'multer';
import { handleUploadAsset, handleDeleteAsset, handleListAssets } from '../controllers/document.asset.controller.js';
import { requireDocumentPermission } from "../../../core/middleware/permission.middleware.js";

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, 
});

router.post("/", requireAuth, createDocument);

router.get("/:documentId/versions", requireAuth, getDocumentVersions);
router.post("/:documentId/revert/:versionId", requireAuth, revertDocumentVersion);


router.post('/:id/assets', requireAuth, requireDocumentPermission('EDITOR'), upload.single('file'), handleUploadAsset);
router.get('/:id/assets', requireAuth, requireDocumentPermission('VIEWER'), handleListAssets);
router.delete('/:id/assets/:assetId', requireAuth, requireDocumentPermission('EDITOR'), handleDeleteAsset);

export default router;