import express from "express";
import { getProfilePicture } from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile-picture", authMiddleware, getProfilePicture);

export default router;