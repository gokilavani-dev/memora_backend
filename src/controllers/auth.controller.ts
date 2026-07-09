import { Request, Response } from "express";
import { login, signup } from "../services/auth.service";

export async function signupController(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    const user = await signup(name, email, password);
    res.status(201).json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(409).json({ message });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const data = await login(email, password);
    res.status(200).json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    res.status(401).json({ message });
  }
}

export async function meController(req: Request, res: Response) {
  res.json({ userId: (req as any).userId });
}
//condition ? valueIfTrue : valueIfFalse
