import { Router } from "express";
import {
  getUploadUrl,
  confirmUpload,
  summarize,
  transcribe,
  downloadUrl,
} from "../controllers/files.controller";

const router = Router();

router.post("/upload-url", getUploadUrl);
router.post("/:fileId/confirm-upload", confirmUpload);
router.post("/:fileId/summarize", summarize);
router.post("/:fileId/transcribe", transcribe);
router.get("/:fileId/download-url", downloadUrl);

export default router;
