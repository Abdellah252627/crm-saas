import { Router } from "express";
import { z } from "zod";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { loginRateLimiter, registerRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

const router = Router();

router.post("/register", registerRateLimiter, validate(registerSchema), registerController);
router.post("/login", loginRateLimiter, validate(loginSchema), loginController);
router.post("/refresh", loginRateLimiter, refreshController);
router.post("/logout", requireAuth, logoutController);

export default router;