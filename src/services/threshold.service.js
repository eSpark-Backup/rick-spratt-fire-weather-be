import { prisma } from "../prisma.js";
import { CustomError } from "../utils/custom_error.js";

export const createOrUpdateThreshold = async (userId, data) => {
  try {
    const threshold = await prisma.threshold.upsert({
      where: { userId },
      update: {
        temperature: data.temperature,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        windSpeedMin: data.windSpeedMin,
        windSpeedMax: data.windSpeedMax,
        southDir: data.southDir,
        northDir: data.northDir,
        eastDir: data.eastDir,
        westDir: data.westDir,
        northEastDir: data.northEastDir,
        northWestDir: data.northWestDir,
        southEastDir: data.southEastDir,
        southWestDir: data.southWestDir,
      },
      create: {
        userId,
        temperature: data.temperature,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        windSpeedMin: data.windSpeedMin,
        windSpeedMax: data.windSpeedMax,
        southDir: data.southDir,
        northDir: data.northDir,
        eastDir: data.eastDir,
        westDir: data.westDir,
        northEastDir: data.northEastDir,
        northWestDir: data.northWestDir,
        southEastDir: data.southEastDir,
        southWestDir: data.southWestDir,
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
