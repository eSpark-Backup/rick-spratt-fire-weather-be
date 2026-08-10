import express from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, getNotifications);
router.patch("/:id/read", authenticate, markAsRead);
router.delete("/:id", authenticate, deleteNotification);
router.delete("/", authenticate, clearAllNotifications);

export { router as notificationRoutes };
