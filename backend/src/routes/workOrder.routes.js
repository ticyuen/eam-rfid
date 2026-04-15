import express from "express";
import { getWorkOrders, addWorkOrderScan } from "../controllers/workOrder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, getWorkOrders);

router.post("/scan", authMiddleware, addWorkOrderScan);

export default router;