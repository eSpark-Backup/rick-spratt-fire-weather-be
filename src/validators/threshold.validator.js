import Joi from "joi";

const num = Joi.number().min(0).max(500);

const baseSchema = {
  temperature: Joi.number().min(-50).max(90),
  humidity: Joi.number().min(0).max(100),

  // direction-specific min / max
  northDirMin: num,
  northDirMax: num,
  northEastDirMin: num,
  northEastDirMax: num,
  eastDirMin: num,
  eastDirMax: num,
  southEastDirMin: num,
  southEastDirMax: num,
  southDirMin: num,
  southDirMax: num,
  southWestDirMin: num,
  southWestDirMax: num,
  westDirMin: num,
  westDirMax: num,
  northWestDirMin: num,
  northWestDirMax: num,
};

// Require temperature & humidity, others optional
export const createThresholdValidator = Joi.object({
  temperature: baseSchema.temperature.required(),
  humidity: baseSchema.humidity.required(),

  northDirMin: baseSchema.northDirMin,
  northDirMax: baseSchema.northDirMax,
  northEastDirMin: baseSchema.northEastDirMin,
  northEastDirMax: baseSchema.northEastDirMax,
  eastDirMin: baseSchema.eastDirMin,
  eastDirMax: baseSchema.eastDirMax,
  southEastDirMin: baseSchema.southEastDirMin,
  southEastDirMax: baseSchema.southEastDirMax,
  southDirMin: baseSchema.southDirMin,
  southDirMax: baseSchema.southDirMax,
  southWestDirMin: baseSchema.southWestDirMin,
  southWestDirMax: baseSchema.southWestDirMax,
  westDirMin: baseSchema.westDirMin,
  westDirMax: baseSchema.westDirMax,
  northWestDirMin: baseSchema.northWestDirMin,
  northWestDirMax: baseSchema.northWestDirMax,
});
