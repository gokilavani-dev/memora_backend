import { Router } from "express";
import {
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

export default router;
