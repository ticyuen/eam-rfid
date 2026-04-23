import dotenv from "dotenv";
import { ApiError } from "../utils/apiError.js";

dotenv.config();

const getGridEnv = () => {
  switch (process.env.EAM_TENANT) {
    case "DS_MP_2":
      return {
        GRID_USER_INFO_ID: "100014",
        GRID_USER_INFO_NAME: "0U5000",
        
        GRID_ASSET_DETAILS_ID: "100023",
        GRID_ASSET_DETAILS_NAME: "0U5001",
        
        GRID_ASSET_METADATA_ID : "100025",
        GRID_ASSET_METADATA_NAME: "0U6001",
        
        GRID_LATEST_WOSC_ID: "100020",
        GRID_LATEST_WOSC_NAME: "0U5003",
        
        GRID_WO_DETAILS_ID: "100022",
        GRID_WO_DETAILS_NAME: "0U5004",
        
        GRID_ASSET_SCAN_ID: "100024",
        GRID_ASSET_SCAN_NAME: "0U5005",
      }

    case "TSUSHO_TEST":
      return {
        GRID_USER_INFO_ID: "100017",
        GRID_USER_INFO_NAME: "0U5000",
        
        GRID_ASSET_DETAILS_ID: "100018",
        GRID_ASSET_DETAILS_NAME: "0U5001",
        
        GRID_ASSET_METADATA_ID : "100022",
        GRID_ASSET_METADATA_NAME: "0U5002",
        
        GRID_LATEST_WOSC_ID: "100019",
        GRID_LATEST_WOSC_NAME: "0U5003",
        
        GRID_WO_DETAILS_ID: "100020",
        GRID_WO_DETAILS_NAME: "0U5004",
        
        GRID_ASSET_SCAN_ID: "100021",
        GRID_ASSET_SCAN_NAME: "0U5005",
      }

    default:
      throw new ApiError(500, `Invalid Grid Environment (${process.env.EAM_TENANT})`)
  }
}

const gridEnv = getGridEnv() || {};
console.log(`EAM Tenant: ${process.env.EAM_TENANT}, GRID_USER_INFO_ID: ${gridEnv.GRID_USER_INFO_ID}`)

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DEV_ENV: process.env.DEV_ENV,

  JWT_SECRET: process.env.JWT_SECRET || "burn1million",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  EAM_BASE_URL: (process.env.DEV_ENV === "HOME") ? process.env.EAM_BASE_URL_VPN : process.env.EAM_BASE_URL,
  EAM_TENANT: process.env.EAM_TENANT,
  EAM_ORG: process.env.EAM_ORG,
  EAM_USERNAME: process.env.EAM_USERNAME,
  EAM_PASSWORD: process.env.EAM_PASSWORD,

  INTEGRATION_USERNAME: process.env.INTEGRATION_USERNAME,
  INTEGRATION_PASSWORD: process.env.INTEGRATION_PASSWORD,

  TZ: process.env.TZ,
  
  GRID_USER_INFO_ID: gridEnv.GRID_USER_INFO_ID,
  GRID_USER_INFO_NAME: gridEnv.GRID_USER_INFO_NAME,
  
  GRID_ASSET_DETAILS_ID: gridEnv.GRID_ASSET_DETAILS_ID,
  GRID_ASSET_DETAILS_NAME: gridEnv.GRID_ASSET_DETAILS_NAME,
  
  GRID_ASSET_METADATA_ID : gridEnv.GRID_ASSET_METADATA_ID,
  GRID_ASSET_METADATA_NAME: gridEnv.GRID_ASSET_METADATA_NAME,
  
  GRID_LATEST_WOSC_ID: gridEnv.GRID_LATEST_WOSC_ID,
  GRID_LATEST_WOSC_NAME: gridEnv.GRID_LATEST_WOSC_NAME,
  
  GRID_WO_DETAILS_ID: gridEnv.GRID_WO_DETAILS_ID,
  GRID_WO_DETAILS_NAME: gridEnv.GRID_WO_DETAILS_NAME,
  
  GRID_ASSET_SCAN_ID: gridEnv.GRID_ASSET_SCAN_ID,
  GRID_ASSET_SCAN_NAME: gridEnv.GRID_ASSET_SCAN_NAME,
};