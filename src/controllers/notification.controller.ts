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

  const total = await prisma.notification.count({
    where: { userId },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: Number(limit),
  });

  const message =
    notifications.length === 0
      ? "No new notifications"
      : "Notifications fetched successfully";

  const meta = {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };

  response.success(res, { notifications, meta }, message);
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

  if (!notification) {
    return response.success(res, {}, "No notifications found");
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: !notification.isRead },
  });

  response.success(
    res,
    { notification: updatedNotification },
    "Notification marked as read successfully"
  );
});

const deleteNotification = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.deleteMany({
    where: { id, userId: req.user.id },
  });

  if (notification.count === 0) {
    return response.success(res, {}, "No notifications found");
  }

  response.success(res, {}, "Notification deleted successfully");
});

const clearAllNotifications = asyncWrapper(async (req, res) => {
  const deleted = await prisma.notification.deleteMany({
    where: { userId: req.user.id },
  });

  const message =
    deleted.count === 0
      ? "No notifications found"
      : "All notifications cleared successfully";

  response.success(res, {}, message);
});

export {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};
