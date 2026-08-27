import { Router } from "express";
import {
  askNote,
  createNoteController,
  deleteNoteController,
  getNoteController,
  getNotesController,
  updateNoteController,
} from "../controllers/note.controller";

const router = Router();

router.post("/", createNoteController);
router.get("/", getNotesController);
router.get("/:noteId", getNoteController);
router.put("/:noteId", updateNoteController);
router.delete("/:noteId", deleteNoteController);
router.post("/:noteId/ask", askNote);

export default router;
