import type { Request, Response } from "express";
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
} from "../services/client.service.js";
import { requireStringParam, requireUserId } from "../utils/request.js";

export async function createClientController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const client = await createClient(userId, req.body);
  res.status(201).json({ client });
}

export async function getClientsController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const result = await getClients(userId, req.query);
  res.status(200).json(result);
}

export async function getClientByIdController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const client = await getClientById(userId, requireStringParam(req, "id"));
  res.status(200).json({ client });
}

export async function updateClientController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const client = await updateClient(userId, requireStringParam(req, "id"), req.body);
  res.status(200).json({ client });
}

export async function deleteClientController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  await deleteClient(userId, requireStringParam(req, "id"));
  res.status(204).send();
}