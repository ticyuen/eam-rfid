import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getWorkOrderScanAssets, getWorkOrderScanStatus, saveWorkOrderScanResult } from "../controllers/workOrderScan.controller.js";

const router = express.Router();

router.post("/:workOrderScanUuid/work-order/:workOrderId/zone/:zoneCode/save-result", authMiddleware, saveWorkOrderScanResult);

router.get("/status", authMiddleware, getWorkOrderScanStatus);

router.get("/assets", authMiddleware, getWorkOrderScanAssets);

export default router;