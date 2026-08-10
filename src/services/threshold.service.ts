import { prisma } from "../prisma.js";
import { CustomError } from "../utils/custom_error.js";

export const createOrUpdateThreshold = async (userId, data) => {
  try {
    const threshold = await prisma.threshold.upsert({
      where: { userId },
      update: {
        temperature: data.temperature,

        relativeHumidity: data.relativeHumidity ?? null,

        dispersionIndexMin: data.dispersionIndexMin ?? null,
        dispersionIndexMax: data.dispersionIndexMax ?? null,

        northDirMin: data.northDirMin,
        northDirMax: data.northDirMax,
        southDirMin: data.southDirMin,
        southDirMax: data.southDirMax,
        eastDirMin: data.eastDirMin,
        eastDirMax: data.eastDirMax,
        westDirMin: data.westDirMin,
        westDirMax: data.westDirMax,

        northEastDirMin: data.northEastDirMin,
        northEastDirMax: data.northEastDirMax,
        northWestDirMin: data.northWestDirMin,
        northWestDirMax: data.northWestDirMax,
        southEastDirMin: data.southEastDirMin,
        southEastDirMax: data.southEastDirMax,
        southWestDirMin: data.southWestDirMin,
        southWestDirMax: data.southWestDirMax,
      },
      create: {
        userId,
        temperature: data.temperature,

        relativeHumidity: data.relativeHumidity ?? null,

        dispersionIndexMin: data.dispersionIndexMin ?? null,
        dispersionIndexMax: data.dispersionIndexMax ?? null,

        northDirMin: data.northDirMin,
        northDirMax: data.northDirMax,
        southDirMin: data.southDirMin,
        southDirMax: data.southDirMax,
        eastDirMin: data.eastDirMin,
        eastDirMax: data.eastDirMax,
        westDirMin: data.westDirMin,
        westDirMax: data.westDirMax,

        northEastDirMin: data.northEastDirMin,
        northEastDirMax: data.northEastDirMax,
        northWestDirMin: data.northWestDirMin,
        northWestDirMax: data.northWestDirMax,
        southEastDirMin: data.southEastDirMin,
        southEastDirMax: data.southEastDirMax,
        southWestDirMin: data.southWestDirMin,
        southWestDirMax: data.southWestDirMax,
      },
    });
    return threshold;
  } catch (error) {
    console.error("Threshold Service Error:", {
      userId,
      error: error.message,
      stack: error.stack,
    });

    if (
      error.code &&
      error instanceof prisma.Prisma.PrismaClientKnownRequestError
    ) {
      throw new CustomError(
        "Database request failed",
        400,
        "PRISMA_REQUEST_ERROR",
        { userId, originalError: error.message }
      );
    }

    throw new CustomError(
      "Failed to create or update threshold",
      500,
      "THRESHOLD_ERROR",
      { userId, originalError: error.message }
    );
  }
};

export const getUserThreshold = async (userId) => {
  try {
    const threshold = await prisma.threshold.findUnique({ where: { userId } });

    if (!threshold) {
      throw new CustomError("Threshold not found for user", 404, "NOT_FOUND", {
        userId,
      });
    }

    return threshold;
  } catch (error) {
    if (error instanceof CustomError) throw error;

    console.error("Threshold Service Fetch Error:", {
      userId,
      error: error.message,
      stack: error.stack,
    });

    throw new CustomError(
      "Failed to fetch threshold",
      500,
      "THRESHOLD_FETCH_ERROR",
      { userId, originalError: error.message }
    );
  }
};
