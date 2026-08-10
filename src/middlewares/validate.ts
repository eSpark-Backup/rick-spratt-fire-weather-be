import { CustomError } from "../utils/custom_error.js";

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    return next(new CustomError(message, 422));
  }

  next();
};

export { validate };
