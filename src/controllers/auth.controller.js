import { prisma } from "../prisma.js";
import { hashPassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import { asyncWrapper } from "../utils/async_wrapper.js";
import { CustomError } from "../utils/custom_error.js";
import { comparePassword } from "../utils/hash.js";
import * as response from "../utils/response.js";

const signUp = asyncWrapper(async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    country = "US",
    state = "Florida",
    zoneId,
  } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new CustomError("Email already registered", 409);
  }

  if (!zoneId) {
    throw new CustomError("Zone is required", 400);
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
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new CustomError("Invalid credentials", 401);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new CustomError("Invalid credentials", 401);
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
  const userId = req.user.id;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
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


export { signUp, login, updateZone };
