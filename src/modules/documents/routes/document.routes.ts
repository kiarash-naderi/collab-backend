
import { Router } from "express";
import { getVersions, revertVersion } from "../controllers/document.http.controller.js";
import { authenticateFromCookie } from "../../../core/middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.get("/versions", authenticateFromCookie, getVersions);
router.post("/revert/:versionId", authenticateFromCookie, revertVersion);

export default router;