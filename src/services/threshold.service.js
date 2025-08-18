import { prisma } from "../prisma.js";
import { CustomError } from "../utils/custom_error.js";

export const createOrUpdateThreshold = async (userId, data) => {
  try {
    const threshold = await prisma.threshold.upsert({
      where: { userId },
      update: {
        tempMin: data.tempMin,
        tempMax: data.tempMax,
        rhMin: data.rhMin,
        rhMax: data.rhMax,
        windMin: data.windMin,
        windMax: data.windMax,
      },
      create: {
        userId,
        tempMin: data.tempMin,
        tempMax: data.tempMax,
        rhMin: data.rhMin,
        rhMax: data.rhMax,
        windMin: data.windMin,
        windMax: data.windMax,
      },
    });
    return threshold;
  } catch (error) {
    console.error("Error during threshold creation or update:", error);
    throw new CustomError("Failed to create or update threshold", 500);
  }
};

export const getUserThreshold = async (userId) => {
  try {
    const threshold = await prisma.threshold.findUnique({
      where: { userId },
    });
    if (!threshold) {
      throw new CustomError("Threshold not found", 404);
    }
    return threshold;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError("Failed to fetch threshold", 500);
  }
};
