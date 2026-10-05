import { Router } from "express";
import { z } from "zod";
import {
  createClientController,
  deleteClientController,
  getClientByIdController,
  getClientsController,
  updateClientController,
} from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import contactRoutes from "./contact.routes.js";

const stageSchema = z.enum(["LEAD", "CONTACTED", "PROPOSAL", "WON", "LOST"]);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(max).nullish(),
  );

const optionalSearch = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).max(120).optional(),
);

const optionalStage = z.preprocess(
  (value) => (value === "" ? undefined : value),
  stageSchema.optional(),
);

const optionalPositiveInt = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.number().int().min(1).max(max).optional(),
  );

const createClientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: optionalText(120),
  email: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().email().max(255).nullish(),
  ),
  phone: optionalText(40),
  city: optionalText(120),
  stage: stageSchema.optional(),
});

const listClientsSchema = z.object({
  stage: optionalStage,
  search: optionalSearch,
  page: optionalPositiveInt(100_000),
  limit: optionalPositiveInt(100),
});

const clientIdSchema = z.object({
  id: z.uuid(),
});

const updateClientSchema = createClientSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const router = Router();

router.use(requireAuth);

router.use(contactRoutes);

router.post("/", validate(createClientSchema), createClientController);
router.get("/", validate(listClientsSchema, "query"), getClientsController);
router.get("/:id", validate(clientIdSchema, "params"), getClientByIdController);
router.patch(
  "/:id",
  validate(clientIdSchema, "params"),
  validate(updateClientSchema),
  updateClientController,
);
router.delete("/:id", validate(clientIdSchema, "params"), deleteClientController);

export default router;