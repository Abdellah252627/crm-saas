import { Router } from "express";
import { z } from "zod";
import {
  getClientsByStageController,
  updateClientStageController,
} from "../controllers/pipeline.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const stageSchema = z.enum(["LEAD", "CONTACTED", "PROPOSAL", "WON", "LOST"]);

const stageParamsSchema = z.object({
  clientId: z.uuid(),
});

const updateStageSchema = z.object({
  stage: stageSchema,
});

const router = Router();

router.use(requireAuth);

router.get("/", getClientsByStageController);
router.patch(
  "/:clientId/stage",
  validate(stageParamsSchema, "params"),
  validate(updateStageSchema),
  updateClientStageController,
);

export default router;