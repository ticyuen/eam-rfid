import { UAParser } from "ua-parser-js";

export function getDeviceName() {
  const parser = new UAParser();

  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  const deviceInfo = { device, os, browser };
  
  console.log('Device Info: ', deviceInfo);

  // Priority:
  // 1. Real device model (best case)
  // 2. OS name (Android / Windows / iOS)
  // 3. Browser fallback

  // if (device.model) {
  //   return device.model; // e.g. "TC22", "iPhone", etc.
  // }

  // if (os.name) {
  //   return `${os.name} Device`; // e.g. "Android Device"
  // }

  // return `${browser.name || "Unknown"} Device`;
  return `${device.model}, ${os.name}, ${browser.name}`;
}