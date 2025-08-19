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
import ValidationError from "joi";
import { Prisma } from "@prisma/client";
import admin from "firebase-admin";

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

  // Joi validation error
  if (err instanceof ValidationError) {
    return { status: 400, message: err.message, code: "VALIDATION_ERROR" };
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      status: 400,
      message: err.meta?.cause || "Database request error",
      code: "PRISMA_REQUEST_ERROR",
    };
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      message: err.message,
      code: "PRISMA_VALIDATION_ERROR",
    };
  }

  // Firebase errors
  if (err instanceof admin.FirebaseError) {
    return {
      status: 500,
      message: "Firebase service error",
      code: "FIREBASE_ERROR",
    };
  }

  // Fallback for unknown/unexpected errors
  return {
    status: 500,
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  };
};

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  // Parse the error for safe frontend response
  const { status, message, code } = parseError(err);

  // Logging
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(err.stack || err);
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${message}`);
  }

  // Send structured response
  res.status(status).json({
    success: false,
    message,
    code,
    data: null,
    ...(isDev && { stack: err.stack }),
  });
};

export { errorHandler };

