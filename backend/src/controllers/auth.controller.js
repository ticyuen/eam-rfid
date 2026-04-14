import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { loginService } from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "username and password are required");
  }

  if (req.context) {
    req.context.username = username;
  }

  // TO REMOVE: Sample Data
  // req.context = {
  //   correlationId: '04b071de-7a33-4672-8438-0a0f9962f7c7',
  //   clientIp: '127.0.0.1',
  //   startTime: 1775456654150,
  //   batch: '20260406062414',
  //   sequence: { value: 0 }
  // }

  const data = await loginService(
    { username, password },
    req.context
  );

  res.json(new ApiResponse({ data }));
});