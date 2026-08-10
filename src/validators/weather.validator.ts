import Joi from "joi";

export const getZonesValidator = Joi.object({
  area: Joi.string().trim().length(2).default("FL"),
  type: Joi.string().trim(),
  limit: Joi.number().integer().min(1).default(500),
  effective: Joi.string().isoDate().optional(),
  include_geometry: Joi.boolean().default(false),
});

export const getWeatherValidator = Joi.object({
  zoneId: Joi.string().trim().required(),
  start: Joi.string().isoDate().optional(),
  end: Joi.string().isoDate().optional(),
  limit: Joi.number().integer().min(1).optional(),
});
