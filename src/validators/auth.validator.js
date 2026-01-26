import Joi from "joi";

const signUpSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message(
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 digit",
    )
    .required(),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required(),
  country: Joi.string().default("US"),
  state: Joi.string().default("Florida"),
  zoneId: Joi.string().required(),
  deviceToken: Joi.string()
    .trim()
    .pattern(/^([a-zA-Z0-9\-\_:])+$/)
    .message("Invalid FCM device token format")
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const updateZoneSchema = Joi.object({
  zoneId: Joi.string().trim().required(),
});

const updateDeviceTokenSchema = Joi.object({
  deviceToken: Joi.string()
    .trim()
    .pattern(/^([a-zA-Z0-9\-\_:])+$/)
    .message("Invalid FCM device token format")
    .required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message(
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 digit",
    )
    .required(),
  confirmPassword: Joi.string().required(),
});

export {
  signUpSchema,
  loginSchema,
  updateZoneSchema,
  updateDeviceTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
