import type { Request, Response } from "express";
import { getStats } from "../services/dashboard.service.js";
import { requireUserId } from "../utils/request.js";

export async function getDashboardController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const stats = await getStats(userId);
  res.status(200).json(stats);
}