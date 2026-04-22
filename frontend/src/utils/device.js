import { UAParser } from "ua-parser-js";

export function getDeviceName() {
  const parser = new UAParser();
  
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  // Priority:
  // 1. Real device model (best case)
  // 2. OS name (Android / Windows / iOS)
  // 3. Browser fallback
  
  return `${device.model ?? "-"}, ${os.name ?? "-"}, ${browser.name ?? "-"}`;
}