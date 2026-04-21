import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import { getAsset, searchAssets, scanAssetsByRFID, getAssetMetadata } from "../controllers/asset.controller.js";
import { getAssetDetails } from "../controllers/asset.controller.js";
import { getAssetsByZone } from "../controllers/asset.controller.js";


const router = express.Router();

router.get("/search", authMiddleware, searchAssets);

router.get("/details", authMiddleware, getAssetDetails);

router.get("/metadata", authMiddleware, getAssetMetadata);

router.post("/rfid/scan", authMiddleware, scanAssetsByRFID);

router.get("/zone/:zone", authMiddleware, getAssetsByZone);

router.get("/", authMiddleware, getAsset);

export default router;