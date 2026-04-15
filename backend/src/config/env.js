import dotenv from "dotenv";
import { ApiError } from "../utils/apiError.js";

dotenv.config();

const getEnv = () => {
  switch (process.env.DEV_ENV) {
    case "DEMO":
      return {
        baseUrl: process.env.EAM_BASE_URL,
        tenant: process.env.EAM_TENANT,
        org: process.env.EAM_ORG,
        username: process.env.EAM_USERNAME,
        password: process.env.EAM_PASSWORD
      }

    case "OFFICE":
      return {
        baseUrl: process.env.OFFICE_BASE_URL,
        tenant: process.env.OFFICE_TENANT,
        org: process.env.OFFICE_ORG,
        username: process.env.OFFICE_USERNAME,
        password: process.env.OFFICE_PASSWORD
      }

    default:
      throw new ApiError(500, `Invalid DEV_ENV (${process.env.DEV_ENV})`)
  }
}

const envConfig = getEnv() || {};
console.log("envConfig: ", envConfig);

export const ENV = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || "development",
  DEV_ENV: process.env.DEV_ENV,

  JWT_SECRET: process.env.JWT_SECRET || "burn1million",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  EAM_BASE_URL: envConfig.baseUrl,
  EAM_TENANT: envConfig.tenant,
  EAM_ORG: envConfig.org,
  EAM_USERNAME: envConfig.username,
  EAM_PASSWORD: envConfig.password,

  DEMO_BASE_URL: process.env.EAM_BASE_URL,
  DEMO_TENANT: process.env.EAM_TENANT,
  DEMO_ORG: process.env.EAM_ORG,
  DEMO_USERNAME: process.env.EAM_USERNAME,
  DEMO_PASSWORD: process.env.EAM_PASSWORD,

  INTEGRATION_USERNAME: process.env.INTEGRATION_USERNAME,
  INTEGRATION_PASSWORD: process.env.INTEGRATION_PASSWORD,

  TZ: process.env.TZ
};