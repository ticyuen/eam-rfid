import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getWorkOrdersService } from "../services/workOrder.service.js";

export const getWorkOrders = asyncHandler(async (req, res) => {
  const {
    org,
    location,
    fromDate,
    toDate,
    workOrderCode
  } = req.body;

  const data = await getWorkOrdersService(
    { org, location, fromDate, toDate, workOrderCode },
    req.context
  );

  res.json(new ApiResponse({ data }));
});