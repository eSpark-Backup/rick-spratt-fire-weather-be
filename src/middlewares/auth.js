import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import { CustomError } from "../utils/custom_error.js";
import { asyncWrapper } from "../utils/async_wrapper.js";

const authenticate = asyncWrapper(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError("Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      user_id: payload.user_id,
      email: payload.email,
    };
    next();
  } catch (err) {
    throw new CustomError("Invalid or expired token", 401);
  }
});

export { authenticate };
