// import { CustomError } from "../utils/custom_error.js";

// const errorHandler = (err, req, res, next) => {
//   console.log(err);
//   const status = err.statusCode || 500;
//   const message = err.message || "Something went wrong";

//   res.status(status).json({
//     success: false,
//     message,
//     data: null,
//   });
// };

// export { errorHandler };

import { CustomError } from "../utils/custom_error.js";
import { Prisma } from "@prisma/client";

// Helper to detect operational errors
const isOperationalError = (err) => err instanceof CustomError;

// Map common error types to frontend-friendly messages
const parseError = (err) => {
  if (isOperationalError(err)) {
    return {
      status: err.statusCode || 400,
      message: err.message,
      code: err.code || "OP_ERROR",
    };
  }

  if (err?.isJoi || err?.name === "ValidationError") {
    return { status: 400, message: err.message, code: "VALIDATION_ERROR" };
  }

  if (
    typeof Prisma?.PrismaClientKnownRequestError === "function" &&
    err instanceof Prisma.PrismaClientKnownRequestError
  ) {
    return {
      status: 400,
      message: err.meta?.cause || "Database request error",
      code: "PRISMA_REQUEST_ERROR",
    };
  }

  if (
    typeof Prisma?.PrismaClientValidationError === "function" &&
    err instanceof Prisma.PrismaClientValidationError
  ) {
    return {
      status: 400,
      message: err.message,
      code: "PRISMA_VALIDATION_ERROR",
    };
  }

  if (err?.code && typeof err.code === "string") {
    if (err.code.startsWith("auth/")) {
      return {
        status: 400,
        message: err.message || "Firebase authentication error",
        code: "FIREBASE_AUTH_ERROR",
      };
    }
    if (err.code.startsWith("messaging/")) {
      return {
        status: 500,
        message: err.message || "Firebase messaging error",
        code: "FIREBASE_MSG_ERROR",
      };
    }
    return {
      status: 500,
      message: err.message || "Firebase service error",
      code: "FIREBASE_ERROR",
    };
  }

  return {
    status: 500,
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  };
};

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  // 🔎 Parse for response
  const { status, message, code } = parseError(err);

  // 🔎 Always log full error internally
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);

  // 🔎 Send safe structured response
  res.status(status).json({
    success: false,
    message,
    code,
    data: null,
    ...(isDev && { stack: err.stack }),
  });
};

export { errorHandler };
