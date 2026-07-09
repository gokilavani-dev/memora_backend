import { Router } from "express";
import {
  loginController,
  meController,
  signupController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.get("/me", authMiddleware, meController);

export default router;
