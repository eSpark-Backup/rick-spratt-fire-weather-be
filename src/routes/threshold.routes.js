import express from "express";
import {
  createOrUpdateThreshold,
  getThreshold,
} from "../controllers/threshold.controller.js";
import { validate } from "../middlewares/validate.js";
import { createThresholdValidator } from "../validators/threshold.validator.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Upsert (create or update) threshold
router.post(
  "/",
  authenticate,
  validate(createThresholdValidator, "body"),
  createOrUpdateThreshold
);

// Get threshold for authenticated user
router.get("/", authenticate, getThreshold);

export { router as thresholdRoutes };
