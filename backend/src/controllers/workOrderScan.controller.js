import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { saveWorkOrderScanResultService, getWorkOrderScanStatusService, getWorkOrderScanAssetsService } from "../services/workOrderScan.service.js";

export const saveWorkOrderScanResult = asyncHandler(async (req, res) => {
  const { workOrderScanUuid, zoneCode } = req.params;
  const { locationId } = req.query;

  const body = req.body;
  const isBatch = Array.isArray(body.assets);

  let scans = isBatch ? body.assets : [body];

  if (!scans.length) {
    throw new ApiError(400, "No scan data provided");
  }

  // inject route context into each scan
  scans = scans.map(s => ({
    ...s,
    workOrderScanUuid,
    locationId: locationId,
    zoneCode
  }));

  const results = await saveWorkOrderScanResultService(scans, req.context);

  res.json(
    new ApiResponse({
      data: results,
      message: `${results?.total} Scan(s) processed`
    })
  );
});

export const getWorkOrderScanStatus = asyncHandler(async (req, res) => {
  const { workOrderId } = req.query;

  if (!workOrderId) {
    throw new ApiError(400, "workOrderId is required");
  }

  const data = await getWorkOrderScanStatusService(
    { workOrderId },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const getWorkOrderScanAssets = asyncHandler(async (req, res) => {
  const { workOrderId, scanSeq } = req.query;

  if (!workOrderId) {
    throw new ApiError(400, "workOrderId is required");
  }

  const data = await getWorkOrderScanAssetsService(
    { workOrderId, scanSeq },
    req.context
  );

  res.json(new ApiResponse({ data }));
});