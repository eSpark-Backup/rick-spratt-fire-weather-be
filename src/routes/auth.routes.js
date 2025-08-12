import express from "express";
import { signUp, login } from "../controllers/auth.controller.js";
import { signUpSchema, loginSchema } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), login);

export { router as authRoutes };
