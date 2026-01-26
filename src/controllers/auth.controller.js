import { prisma } from "../prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/email.js";
import crypto from "crypto";
import { asyncWrapper } from "../utils/async_wrapper.js";
import { CustomError } from "../utils/custom_error.js";
import * as response from "../utils/response.js";
import { getZoneById } from "../services/weather.service.js";
import * as thresholdService from "../services/threshold.service.js";

const OTP_EXPIRATION_MINUTES = parseInt(
  process.env.OTP_EXPIRATION_MINUTES || "15",
  10,
);

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
    temperature: null,
    relativeHumidity: null,

    dispersionIndexMin: null,
    dispersionIndexMax: null,

    northDirMin: null,
    northDirMax: null,
    southDirMin: null,
    southDirMax: null,
    eastDirMin: null,
    eastDirMax: null,
    westDirMin: null,
    westDirMax: null,

    northEastDirMin: null,
    northEastDirMax: null,
    northWestDirMin: null,
    northWestDirMax: null,
    southEastDirMin: null,
    southEastDirMax: null,
    southWestDirMin: null,
    southWestDirMax: null,
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
    "User registered successfully",
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
    "Logged in successfully",
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
    "Zone updated successfully",
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
    "Device token updated successfully",
  );
});

const forgotPassword = asyncWrapper(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return response.success(
      res,
      {},
      "An OTP has been sent to your email, please check your inbox",
    );
  }

  // generate 6-digit OTP
  const otp = String(100000 + crypto.randomInt(0, 900000));

  // hash OTP before storing
  const otpHash = await hashPassword(otp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      email: user.email,
      otpHash,
      expiresAt,
      used: false,
    },
  });

  // send email with OTP
  const subject = "Your password reset code";
  const text = `Your password reset code is: ${otp}. It expires in ${OTP_EXPIRATION_MINUTES} minutes.`;
  const html = `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code expires in ${OTP_EXPIRATION_MINUTES} minutes.</p>`;

  try {
    await sendMail({ to: user.email, subject, text, html });
  } catch (err) {
    console.error("Error sending OTP email", err);
  }

  return response.success(
    res,
    {},
    "An OTP has been sent to your email, please check your inbox",
  );
});

const verifyOtp = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;

  const record = await prisma.passwordReset.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
  }

  if (record.expiresAt < new Date()) {
    throw new CustomError("OTP expired", 400, "OTP_EXPIRED");
  }

  const match = await comparePassword(otp, record.otpHash);
  if (!match) {
    throw new CustomError("Invalid OTP", 400, "INVALID_OTP");
  }

  // mark as used
  await prisma.passwordReset.update({
    where: { id: record.id },
    data: { used: true },
  });

  // issue short-lived reset token
  const resetToken = jwt.sign(
    { email, sub: record.userId || null, purpose: "password_reset" },
    process.env.JWT_SECRET || "default_jwt_secret",
    { expiresIn: "15m" },
  );

  return response.success(res, { resetToken }, "OTP verified");
});

const resetPassword = asyncWrapper(async (req, res) => {
  const { resetToken, password, confirmPassword } = req.body;

  let payload;
  try {
    payload = jwt.verify(
      resetToken,
      process.env.JWT_SECRET || "default_jwt_secret",
    );
  } catch (err) {
    throw new CustomError(
      "Invalid or expired reset token",
      400,
      "INVALID_TOKEN",
    );
  }

  if (payload.purpose !== "password_reset") {
    throw new CustomError("Invalid reset token", 400, "INVALID_TOKEN");
  }

  const email = payload.email;
  if (!email)
    throw new CustomError("Invalid token payload", 400, "INVALID_TOKEN");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new CustomError("User not found", 404, "NOT_FOUND");

  if (password !== confirmPassword) {
    throw new CustomError("Passwords do not match", 400, "PASSWORD_MISMATCH");
  }

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { email }, data: { password: hashed } });

  return response.success(res, {}, "Password changed successfully");
});

export {
  signUp,
  login,
  updateZone,
  updateDeviceToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
