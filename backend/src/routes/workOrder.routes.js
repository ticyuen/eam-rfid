import express from "express";
import { getWorkOrders, addWorkOrderScan, updateWorkOrderStatus } from "../controllers/workOrder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, getWorkOrders);

router.post("/scan", authMiddleware, addWorkOrderScan);

router.patch("/status", authMiddleware, updateWorkOrderStatus);

export default router;