import { Router } from "express";
import { getDashboardController } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getDashboardController);

export default router;