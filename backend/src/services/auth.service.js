import { getUserFromGrid, updateLoginAttempts } from "./user.service.js";
import { signToken } from "../lib/jwt.js";
import { ApiError } from "../utils/apiError.js";
import { isExpired } from "../utils/date.util.js";

export async function loginService({ username, password }, context) {
  const user = await getUserFromGrid(username, context);

  const maxAttempts = user.maxLoginAttempts || 5;

  if (user.lockedDate) {
    throw new ApiError(403, "Account is locked");
  }

  if (isExpired(user.userExpire)) {
    throw new ApiError(403, "User account is expired");
  }

  if (isExpired(user.passExpire)) {
    throw new ApiError(403, "Password is expired");
  }

  if (password !== user.password) {
    const newAttempts = (user.loginAttempts || 0) + 1;

    const shouldLock = newAttempts >= maxAttempts;
    console.log(`User login attempt (${newAttempts}/${maxAttempts})`)

    await updateLoginAttempts(
      username,
      {
        attempts: newAttempts,
        lock: shouldLock
      },
      context
    );

    if (shouldLock) {
      throw new ApiError(403, "Account locked due to too many failed attempts");
    }

    throw new ApiError(401, "Invalid username or password");
  }

  if ((user.loginAttempts || 0) > 0) {
    await updateLoginAttempts(
      username,
      {
        attempts: 0,
        lock: false
      },
      context
    );
  }

  const token = signToken({
    username: user.username,
    description: user.description
  });

  return {
    token,
    username: user.username,
    description: user.description
  };
}