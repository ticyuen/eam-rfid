import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import { getAsset, searchAssets } from "../controllers/asset.controller.js";
import { getAssetDetails } from "../controllers/asset.controller.js";
import { getAssetsByLocation } from "../controllers/asset.controller.js";


const router = express.Router();

router.get("/details", authMiddleware, getAssetDetails);

router.get("/search", authMiddleware, searchAssets);

router.get("/location/:location", authMiddleware, getAssetsByLocation);

router.get("/", authMiddleware, getAsset);

export default router;