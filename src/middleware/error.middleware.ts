import { Request, Response, NextFunction } from "express";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  res.status(500).json({ message });
}
