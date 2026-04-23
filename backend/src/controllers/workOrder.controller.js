import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getWorkOrdersService, addWorkOrderScanService, updateWorkOrderStatusService } from "../services/workOrder.service.js";

export const getWorkOrders = asyncHandler(async (req, res) => {
  const {
    org,
    location,
    fromDate,
    toDate,
    workOrderCode,
    status
  } = req.body;

  const data = await getWorkOrdersService(
    { org, location, fromDate, toDate, workOrderCode, status },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const addWorkOrderScan = asyncHandler(async (req, res) => {
  const {
    workOrderId,
    status,
    deviceName,
    deviceIp,
    remark
  } = req.body;

  if (!workOrderId || !status) {
    throw new ApiError(400, "workOrderId and status are required");
  }

  const data = await addWorkOrderScanService(
    {
      workOrderId,
      status,
      deviceName,
      deviceIp: deviceIp ?? req.context?.clientIp,
      remark
    },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const updateWorkOrderStatus = asyncHandler(async (req, res) => {
  const { workOrderId, orgCode } = req.query;
  const { status } = req.body;

  if (!workOrderId || !orgCode) {
    throw new ApiError(400, "workOrderId and orgCode are required");
  }

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const data = await updateWorkOrderStatusService(
    { workOrderId, orgCode, status },
    req.context
  );

  res.json(new ApiResponse({ data }));
});