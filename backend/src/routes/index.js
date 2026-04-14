import express from "express";

import authRoutes from "./auth.routes.js";
import workOrderRoutes from "./workOrder.routes.js";
import assetRoutes from "./asset.routes.js";
import documentRoutes from "./document.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/work-order", workOrderRoutes);
router.use("/asset", assetRoutes);
router.use("/asset", documentRoutes);

export default router;