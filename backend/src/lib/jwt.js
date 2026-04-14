import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export function signToken(payload, expiresIn = ENV.JWT_EXPIRES_IN) {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}