import Joi from "joi";

const baseSchema = {
  tempMin: Joi.number().min(-50).max(60),
  tempMax: Joi.number().min(-50).max(60),
  rhMin: Joi.number().min(0).max(100),
  rhMax: Joi.number().min(0).max(100),
  windMin: Joi.number().min(0).max(200),
  windMax: Joi.number().min(0).max(200),
};

export const createThresholdValidator = Joi.object({
  tempMin: baseSchema.tempMin.required(),
  tempMax: baseSchema.tempMax.required(),
  rhMin: baseSchema.rhMin.required(),
  rhMax: baseSchema.rhMax.required(),
  windMin: baseSchema.windMin.required(),
  windMax: baseSchema.windMax.required(),
});
