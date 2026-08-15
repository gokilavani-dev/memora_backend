import { Request, Response } from "express";
import {
  createNote,
  deleteNote,
  getNote,
  getNotes,
  updateNote,
} from "../services/note.service";

export async function createNoteController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { title, content, fileId, fileName } = req.body;
    const note = await createNote(userId, title, content, fileId, fileName);
    res.status(201).json(note);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function getNotesController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const notes = await getNotes(userId);
    res.status(200).json(notes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function getNoteController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const noteId = req.params.noteId as string;
    const note = await getNote(userId, noteId);
    res.status(200).json(note);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function updateNoteController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const noteId = req.params.noteId as string;
    const { title, content } = req.body;
    const updatedNote = await updateNote(userId, noteId, title, content);
    res.status(200).json(updatedNote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}

export async function deleteNoteController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const noteId = req.params.noteId as string;
    await deleteNote(userId, noteId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(500).json({ message });
  }
}
