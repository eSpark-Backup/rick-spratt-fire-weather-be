import Joi from "joi";

const baseSchema = {
  temperature: Joi.number().min(-50).max(90),
  humidity: Joi.number().min(0).max(100),
  windSpeed: Joi.number().min(0).max(200),

  southDir: Joi.number().min(0).max(100),
  northDir: Joi.number().min(0).max(100),
  eastDir: Joi.number().min(0).max(100),
  westDir: Joi.number().min(0).max(100),
};

export const createThresholdValidator = Joi.object({
  temperature: baseSchema.temperature.required(),
  humidity: baseSchema.humidity.required(),
  windSpeed: baseSchema.windSpeed.required(),
  southDir: baseSchema.southDir.required(),
  northDir: baseSchema.northDir.required(),
  eastDir: baseSchema.eastDir.required(),
  westDir: baseSchema.westDir.required(),
});
