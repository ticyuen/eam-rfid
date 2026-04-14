import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.resolve("logs");
const auditDir = path.join(logDir, ".audit"); // hidden folder

// Ensure directories exist
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

// Format for all logs
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  })
);

// Daily rotating log for general info
const dailyTransport = new DailyRotateFile({
  filename: path.join(logDir, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  auditFile: path.join(auditDir, "combined-audit.json")
});

// Daily rotating log for errors
const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  auditFile: path.join(auditDir, "error-audit.json")
});

// Winston logger instance
const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    dailyTransport,
    errorTransport,
    new winston.transports.Console()
  ]
});

export default logger;