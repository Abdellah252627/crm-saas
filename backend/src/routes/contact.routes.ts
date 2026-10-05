import { Router } from "express";
import { z } from "zod";
import {
  createContactController,
  deleteContactController,
  getContactsByClientController,
} from "../controllers/contact.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const createContactSchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING"]),
  note: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(2000).nullish(),
  ),
  date: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});

const clientIdParamsSchema = z.object({
  clientId: z.uuid(),
});

const contactParamsSchema = z.object({
  clientId: z.uuid(),
  id: z.uuid(),
});

const router = Router();

router.use(requireAuth);

router.post(
  "/:clientId/contacts",
  validate(clientIdParamsSchema, "params"),
  validate(createContactSchema),
  createContactController,
);
router.get("/:clientId/contacts", validate(clientIdParamsSchema, "params"), getContactsByClientController);
router.delete(
  "/:clientId/contacts/:id",
  validate(contactParamsSchema, "params"),
  deleteContactController,
);

export default router;