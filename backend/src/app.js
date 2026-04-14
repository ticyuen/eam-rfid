import express from "express";
import helmet from "helmet";
import cors from "cors";

import { ENV } from "./config/env.js";
import { apiLimiter } from "./config/rateLimit.js";
import { swaggerSetup } from "./config/swagger.js";

import routes from "./routes/index.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import { contextMiddleware } from "./middlewares/context.middleware.js";

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors());
app.use(express.json());

app.set("trust proxy", ENV.NODE_ENV === "development" ? false : 1);

// Context
app.use(contextMiddleware);

// Rate limit (exclude auth)
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return apiLimiter(req, res, next);
});

// Swagger
app.use("/swagger", ...swaggerSetup);

// Routes
app.use("/api", routes);

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime()
  });
});

// Error
app.use(errorHandler);

export default app;