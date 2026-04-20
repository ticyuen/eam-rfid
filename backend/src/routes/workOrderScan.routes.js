import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getWorkOrderScanStatus, saveWorkOrderScanResult } from "../controllers/workOrderScan.controller.js";

const router = express.Router();

router.post("/:workOrderScanUuid/zone/:zoneCode/save-result", authMiddleware, saveWorkOrderScanResult);

router.get("/status", authMiddleware, getWorkOrderScanStatus);

export default router;