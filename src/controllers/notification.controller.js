import { asyncWrapper } from "../utils/async_wrapper.js";
import * as response from "../utils/response.js";
import { prisma } from "../prisma.js";
import { paginate } from "../utils/pagination.js";
import { CustomError } from "../utils/custom_error.js";

const requirePositiveNumber = (value, field) => {
  if (value !== undefined && (isNaN(value) || Number(value) <= 0)) {
    throw new CustomError(
      `${field} must be a positive number`,
      400,
      "VALIDATION_ERROR",
      { field }
    );
  }
};

const getNotifications = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?.id;

  if (!userId) {
    throw new CustomError("Unauthorized", 401, "AUTH_ERROR");
  }

  requirePositiveNumber(page, "page");
  requirePositiveNumber(limit, "limit");

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!notifications || notifications.length === 0) {
    throw new CustomError("No notifications found", 404, "NOT_FOUND", {
      userId,
    });
  }

  const paginatedResult = paginate(notifications, page, limit);

  response.success(
    res,
    { notifications: paginatedResult.items, meta: paginatedResult.meta },
    "Notifications fetched successfully"
  );
});

const markAsRead = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new CustomError("Unauthorized", 401, "AUTH_ERROR");
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    throw new CustomError("Notification not found", 404, "NOT_FOUND", { id });
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: !notification.isRead },
  });

  response.success(
    res,
    { notification: updatedNotification },
    "Notification marked as read"
  );
});

const deleteNotification = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.deleteMany({
    where: { id, userId: req.user.id },
  });

  if (notification.count === 0) {
    throw new CustomError("Notification not found", 404, "NOT_FOUND", { id });
  }

  response.success(res, {}, "Notification deleted successfully");
});

const clearAllNotifications = asyncWrapper(async (req, res) => {
  await prisma.notification.deleteMany({
    where: { userId: req.user.id },
  });

  response.success(res, {}, "All notifications cleared successfully");
});

export {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};
