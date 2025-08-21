import { prisma } from "../prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import { asyncWrapper } from "../utils/async_wrapper.js";
import { CustomError } from "../utils/custom_error.js";
import * as response from "../utils/response.js";
import { getZoneById } from "../services/weather.service.js";
import * as thresholdService from "../services/threshold.service.js";

const requireFields = (body, fields) => {
  for (const field of fields) {
    if (!body[field]) {
      throw new CustomError(`${field} is required`, 400, "VALIDATION_ERROR", {
        field,
      });
    }
  }
};

const signUp = asyncWrapper(async (req, res) => {
  requireFields(req.body, [
    "firstName",
    "lastName",
    "email",
    "password",
    "zoneId",
  ]);

  const {
    firstName,
    lastName,
    email,
    password,
    country = "US",
    state = "Florida",
    zoneId,
    deviceToken,
  } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new CustomError("Email already registered", 409, "DUPLICATE_EMAIL");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country,
      state,
      zoneId,
      deviceToken,
    },
  });

  const zone = await getZoneById(user.zoneId);
  const zoneName = zone?.name || null;

  const defaultThreshold = {
    temperature: 30,
    humidity: 50,
    windSpeed: 10,
    southDir: 0,
    northDir: 0,
    eastDir: 0,
    westDir: 0,
  };

  await thresholdService.createOrUpdateThreshold(user.id, defaultThreshold);

  const token = generateToken({ userId: user.id, email: user.email });

  response.success(
    res,
    {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: user.country,
      state: user.state,
      zoneId: user.zoneId,
      zoneName,
      token,
    },
    "User registered successfully"
  );
});

const login = asyncWrapper(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new CustomError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new CustomError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { email },
    data: { lastLoginAt: new Date() },
  });

  const zone = await getZoneById(user.zoneId);
  const zoneName = zone?.name || null;

  const token = generateToken({ userId: user.id, email: user.email });

  response.success(
    res,
    {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: user.country,
      state: user.state,
      zoneId: user.zoneId,
      zoneName,
      lastLoginAt: user.lastLoginAt,
      token,
    },
    "Logged in successfully"
  );
});

const updateZone = asyncWrapper(async (req, res) => {
  const { zoneId } = req.body;
  if (!zoneId)
    throw new CustomError("zoneId is required", 400, "VALIDATION_ERROR", {
      field: "zoneId",
    });

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { zoneId },
  });

  response.success(
    res,
    {
      userId: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      country: updatedUser.country,
      state: updatedUser.state,
      zoneId: updatedUser.zoneId,
    },
    "Zone updated successfully"
  );
});

const updateDeviceToken = asyncWrapper(async (req, res) => {
  const { deviceToken } = req.body;
  if (!deviceToken)
    throw new CustomError("deviceToken is required", 400, "VALIDATION_ERROR", {
      field: "deviceToken",
    });

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { deviceToken },
  });

  response.success(
    res,
    { userId: updatedUser.id, deviceToken: updatedUser.deviceToken },
    "Device token updated successfully"
  );
});

export { signUp, login, updateZone, updateDeviceToken };
