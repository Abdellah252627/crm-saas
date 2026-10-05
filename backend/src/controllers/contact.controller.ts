import type { Request, Response } from "express";
import {
  createContact,
  deleteContact,
  getContactsByClient,
} from "../services/contact.service.js";
import { requireStringParam, requireUserId } from "../utils/request.js";

export async function createContactController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const clientId = requireStringParam(req, "clientId");
  const contact = await createContact(userId, clientId, req.body);
  res.status(201).json({ contact });
}

export async function getContactsByClientController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const clientId = requireStringParam(req, "clientId");
  const contacts = await getContactsByClient(userId, clientId);
  res.status(200).json({ contacts, count: contacts.length });
}

export async function deleteContactController(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const clientId = requireStringParam(req, "clientId");
  const id = requireStringParam(req, "id");
  await deleteContact(userId, clientId, id);
  res.status(204).send();
}