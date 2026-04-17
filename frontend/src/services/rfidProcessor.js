import { ASSET_SCAN_STATUS } from "../constants";

export function processRFIDScan(existingTableData, scannedCodes, selectedZone) {

  console.log('existingTableData: ', existingTableData);
  console.log('scannedCodes: ', scannedCodes);
  console.log('selectedZone: ', selectedZone);

  const normalizedCodes = scannedCodes
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  const scannedSet = new Set(normalizedCodes);

  /**
   * 1. Update existing assets WITHOUT resetting previous MATCHED
   */
  const updatedExistingAssets = existingTableData
    .filter(asset => asset.scanStatus !== ASSET_SCAN_STATUS.NEW)
    .map(asset => {

      const code = asset.rfidCode.trim().toUpperCase();

      // Already matched → KEEP IT
      if (asset.scanStatus === ASSET_SCAN_STATUS.MATCHED) {
        return asset;
      }

      // If scanned now → upgrade to MATCHED
      if (scannedSet.has(code)) {
        return { ...asset, status: ASSET_SCAN_STATUS.MATCHED };
      }

      // Otherwise DO NOT downgrade
      return asset;
    });

  /**
   * 2. Keep ALL existing NEW assets (no need to rescan)
   */
  const existingNewAssets = existingTableData.filter(
    asset => asset.scanStatus === ASSET_SCAN_STATUS.NEW
  );

  /**
   * 3. Detect newly scanned assets
   */
  const existingCodes = new Set([
    ...existingTableData.map(a => a.rfidCode.trim().toUpperCase())
  ]);

  const newlyDetectedAssets = [...scannedSet]
    .filter(code => !existingCodes.has(code))
    .map(code => ({
      id: `new-${code}-${selectedZone}`,
      rfidCode: code,
      description: "-",
      parentAsset: "-",
      parentDescription: "-",
      lastUpdated: new Date().toISOString(),
      status: ASSET_SCAN_STATUS.NEW
    }));

  console.log('updatedExistingAssets: ', updatedExistingAssets);
  console.log('existingNewAssets: ', existingNewAssets);
  console.log('newlyDetectedAssets: ', newlyDetectedAssets);

  return [
    ...updatedExistingAssets,
    ...existingNewAssets,
    ...newlyDetectedAssets
  ];
}