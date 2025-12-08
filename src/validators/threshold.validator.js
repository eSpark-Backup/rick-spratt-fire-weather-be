import Joi from "joi";

const dir = Joi.object({
  min: Joi.number().min(0).max(500).allow(null).default(null),
  max: Joi.number().min(0).max(500).allow(null).default(null),
})
  .custom((value, helpers) => {
    const { min, max } = value;

    // Only check if both are non-null numbers
    if (min !== null && max !== null) {
      if (min > max) {
        return helpers.error("any.invalid", {
          message: `"min" cannot be greater than "max"`,
        });
      }
      if (max < min) {
        return helpers.error("any.invalid", {
          message: `"max" cannot be less than "min"`,
        });
      }
    }
    return value;
  })
  .allow(null)
  .default(null);

export const createThresholdValidator = Joi.object({
  temperature: Joi.number().min(-100).max(200).allow(null).default(null),

  humidity: Joi.object({
    min: Joi.number().min(0).max(100).allow(null).default(null),
    max: Joi.number().min(0).max(100).allow(null).default(null),
  })
    .custom((value, helpers) => {
      const { min, max } = value;
      if (min !== null && max !== null && min > max) {
        return helpers.error("any.invalid", {
          message: `"humidity.min" cannot be greater than "humidity.max"`,
        });
      }
      return value;
    })
    .allow(null)
    .default(null),

  dispersion_index: Joi.object({
    min: Joi.number().min(0).max(100).allow(null).default(null),
    max: Joi.number().min(0).max(100).allow(null).default(null),
  })
    .custom((value, helpers) => {
      const { min, max } = value;
      if (min !== null && max !== null && min > max) {
        return helpers.error("any.invalid", {
          message: `"dispersion_index.min" cannot be greater than "dispersion_index.max"`,
        });
      }
      return value;
    })
    .allow(null)
    .default(null),

  wind_speed: Joi.object({
    N: dir,
    NE: dir,
    E: dir,
    SE: dir,
    S: dir,
    SW: dir,
    W: dir,
    NW: dir,
  })
    .allow(null)
    .default(null),
}).default({});
