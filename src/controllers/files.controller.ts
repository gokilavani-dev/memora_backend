import { Request, Response } from "express";
import {
  generateUploadUrl,
  getDownloadUrl,
  processUploadedFile,
  summarizeFile,
  transcribeAudio,
} from "../services/files.service";
export async function getUploadUrl(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res
        .status(400)
        .json({ message: "fileName and fileType are required" });
    }
    const { uploadUrl, key, fileId } = await generateUploadUrl(
      userId,
      fileName,
      fileType,
    );

    return res.status(200).json({ uploadUrl, key, fileId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function confirmUpload(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const fileId = req.params.fileId as string;
    const file = await processUploadedFile(userId, fileId);
    res.status(200).json(file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function summarize(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const fileId = req.params.fileId as string;
    const file = await summarizeFile(userId, fileId);
    res.status(200).json(file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function transcribe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const fileId = req.params.fileId as string;
    const file = await transcribeAudio(userId, fileId);
    res.status(200).json(file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function downloadUrl(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const fileId = req.params.fileId as string;
    const data = await getDownloadUrl(userId, fileId);
    res.status(200).json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}
