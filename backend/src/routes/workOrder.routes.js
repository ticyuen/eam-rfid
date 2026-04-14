import express from "express";
import { getWorkOrders } from "../controllers/workOrder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, getWorkOrders);

export default router;