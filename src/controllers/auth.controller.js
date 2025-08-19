// import { prisma } from "../prisma.js";
// import { hashPassword } from "../utils/hash.js";
// import { generateToken } from "../utils/token.js";
// import { asyncWrapper } from "../utils/async_wrapper.js";
// import { CustomError } from "../utils/custom_error.js";
// import { comparePassword } from "../utils/hash.js";
// import * as response from "../utils/response.js";

// const signUp = asyncWrapper(async (req, res) => {
//   const {
//     first_name,
//     last_name,
//     email,
//     password,
//     country = "US",
//     state = "Florida",
//     zoneId,
//     deviceToken
//   } = req.body;

//   const existingUser = await prisma.user.findUnique({ where: { email } });
//   if (existingUser) {
//     throw new CustomError("Email already registered", 409);
//   }

//   if (!zoneId) {
//     throw new CustomError("Zone is required", 400);
//   }

//   const hashedPassword = await hashPassword(password);

//   const user = await prisma.user.create({
//     data: {
//       firstName: first_name,
//       lastName: last_name,
//       email,
//       password: hashedPassword,
//       country,
//       state,
//       zoneId,
//       deviceToken
//     },
//   });

//   const token = generateToken({ user_id: user.id, email: user.email });

//   response.success(
//     res,
//     {
//       user_id: user.id,
//       first_name: user.firstName,
//       last_name: user.lastName,
//       email: user.email,
//       country: user.country,
//       state: user.state,
//       zoneId: user.zoneId,
//       token,
//     },
//     "User registered successfully"
//   );
// });

// const login = asyncWrapper(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await prisma.user.findUnique({ where: { email } });

//   if (!user) {
//     throw new CustomError("Invalid credentials", 401);
//   }

//   const isMatch = await comparePassword(password, user.password);
//   if (!isMatch) {
//     throw new CustomError("Invalid credentials", 401);
//   }

//   await prisma.user.update({
//     where: { email },
//     data: { lastLoginAt: new Date() },
//   });

//   const token = generateToken({ user_id: user.id, email: user.email });

//   response.success(
//     res,
//     {
//       user_id: user.id,
//       first_name: user.firstName,
//       last_name: user.lastName,
//       email: user.email,
//       country: user.country,
//       state: user.state,
//       zoneId: user.zoneId,
//       lastLoginAt: user.lastLoginAt,
//       token,
//     },
//     "Logged in successfully"
//   );
// });

// const updateZone = asyncWrapper(async (req, res) => {
//   const { zoneId } = req.body;
//   const userId = req.user.id;

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: { zoneId },
//   });

//   response.success(
//     res,
//     {
//       user_id: updatedUser.id,
//       first_name: updatedUser.firstName,
//       last_name: updatedUser.lastName,
//       email: updatedUser.email,
//       country: updatedUser.country,
//       state: updatedUser.state,
//       zoneId: updatedUser.zoneId,
//     },
//     "Zone updated successfully"
//   );
// });

// const updateDeviceToken = asyncWrapper(async (req, res) => {
//   const { deviceToken } = req.body;
//   const userId = req.user.id;

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: { deviceToken },
//   });

//   response.success(
//     res,
//     {
//       user_id: updatedUser.id,
//       deviceToken: updatedUser.deviceToken,
//     },
//     "Device token updated successfully"
//   );
// });

// export { signUp, login, updateZone, updateDeviceToken };

import { prisma } from "../prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import { asyncWrapper } from "../utils/async_wrapper.js";
import { CustomError } from "../utils/custom_error.js";
import * as response from "../utils/response.js";

// Helper to validate required fields
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
    "first_name",
    "last_name",
    "email",
    "password",
    "zoneId",
  ]);

  const {
    first_name,
    last_name,
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
      firstName: first_name,
      lastName: last_name,
      email,
      password: hashedPassword,
      country,
      state,
      zoneId,
      deviceToken,
    },
  });

  const token = generateToken({ user_id: user.id, email: user.email });

  response.success(
    res,
    {
      user_id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      country: user.country,
      state: user.state,
      zoneId: user.zoneId,
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

  const token = generateToken({ user_id: user.id, email: user.email });

  response.success(
    res,
    {
      user_id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      country: user.country,
      state: user.state,
      zoneId: user.zoneId,
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
      user_id: updatedUser.id,
      first_name: updatedUser.firstName,
      last_name: updatedUser.lastName,
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
    { user_id: updatedUser.id, deviceToken: updatedUser.deviceToken },
    "Device token updated successfully"
  );
});

export { signUp, login, updateZone, updateDeviceToken };
