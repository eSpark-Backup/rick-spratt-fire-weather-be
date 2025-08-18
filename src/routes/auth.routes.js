import express from "express";
import { signUp, login, updateZone } from "../controllers/auth.controller.js";
import { signUpSchema, loginSchema, updateZoneSchema } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), login);
router.patch("/zone", authenticate, validate(updateZoneSchema), updateZone);

export { router as authRoutes };
