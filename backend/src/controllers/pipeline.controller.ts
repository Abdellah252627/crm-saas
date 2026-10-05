import type { Request, Response } from "express";
import { getClientsByStage, updateClientStage } from "../services/pipeline.service.js";
import { requireStringParam, requireUserId } from "../utils/request.js";

export async function updateClientStageController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const clientId = requireStringParam(req, "clientId");
  const client = await updateClientStage(userId, clientId, req.body.stage);
  res.status(200).json({ client });
}

export async function getClientsByStageController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const pipeline = await getClientsByStage(userId);
  res.status(200).json({
    pipeline,
    total: Object.values(pipeline).reduce((sum, bucket) => sum + bucket.length, 0),
  });
}