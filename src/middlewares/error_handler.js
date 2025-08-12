import { CustomError } from "../utils/custom_error.js";

const errorHandler = (err, req, res, next) => {
  console.log(err);
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    message,
    data: null,
  });
};

export { errorHandler };
