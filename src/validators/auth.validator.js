import Joi from "joi";

const signUpSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).required(),
  last_name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(8) // 🔒 Stronger minimum length
    .max(100) // 👌 Prevent DoS via long passwords
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$")) // At least 1 lowercase, 1 uppercase, 1 digit
    .message(
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 digit"
    )
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

export { signUpSchema, loginSchema };
