import Joi from "joi";

const dir = Joi.object({
  min: Joi.number().min(0).max(500).required(),
  max: Joi.number().min(0).max(500).required(),
});

export const createThresholdValidator = Joi.object({
  temperature: Joi.number().min(-50).max(90).required(),
  humidity: Joi.number().min(0).max(100).required(),
  wind_speed: Joi.object({
    N: dir.required(),
    NE: dir.required(),
    E: dir.required(),
    SE: dir.required(),
    S: dir.required(),
    SW: dir.required(),
    W: dir.required(),
    NW: dir.required(),
  }).required(),
});
