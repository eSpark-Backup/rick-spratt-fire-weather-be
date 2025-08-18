import Joi from "joi";

const signUpSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).required(),
  last_name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message(
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 digit"
    )
    .required(),
  confirm_password: Joi.any().valid(Joi.ref("password")).required(),
  country: Joi.string().default("US"),
  state: Joi.string().default("Florida"),
  zoneId: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const updateZoneSchema = Joi.object({
  zoneId: Joi.string().trim().required(),
});

export { signUpSchema, loginSchema, updateZoneSchema };
