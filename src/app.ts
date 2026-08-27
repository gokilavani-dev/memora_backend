import express from "express";
import authRoutes from "./routes/auth.routes";
import noteRoutes from "./routes/note.routes";
import fileRoutes from "./routes/files.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "okay" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", authMiddleware, noteRoutes);
app.use("/api/files", authMiddleware, fileRoutes);
app.use(errorHandler);

export default app;
