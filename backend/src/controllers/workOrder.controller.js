import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { getWorkOrdersService } from "../services/grid.service.js";

export const getWorkOrders = asyncHandler(async (req, res) => {
  const { status, fromDate, toDate } = req.body;

  if (!fromDate || !toDate) {
    throw new ApiError(400, "fromDate and toDate are required");
  }

  const data = await getWorkOrdersService(
    { status, fromDate, toDate },
    req.context
  );

  res.json(new ApiResponse({ data }));
});