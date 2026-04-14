import { ASSET_STATUS } from "../constants";

export function processRFIDScan(existingTableData, scannedCodes, selectedLocation) {

  const normalizedCodes = scannedCodes
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  const scannedSet = new Set(normalizedCodes);

  /**
   * 1. Update existing assets WITHOUT resetting previous MATCHED
   */
  const updatedExistingAssets = existingTableData
    .filter(asset => asset.status !== ASSET_STATUS.NEW)
    .map(asset => {

      const code = asset.assetCode.trim().toUpperCase();

      // Already matched → KEEP IT
      if (asset.status === ASSET_STATUS.MATCHED) {
        return asset;
      }

      // If scanned now → upgrade to MATCHED
      if (scannedSet.has(code)) {
        return { ...asset, status: ASSET_STATUS.MATCHED };
      }

      // Otherwise DO NOT downgrade
      return asset;
    });

  /**
   * 2. Keep ALL existing NEW assets (no need to rescan)
   */
  const existingNewAssets = existingTableData.filter(
    asset => asset.status === ASSET_STATUS.NEW
  );

  /**
   * 3. Detect newly scanned assets
   */
  const existingCodes = new Set([
    ...existingTableData.map(a => a.assetCode.trim().toUpperCase())
  ]);

  const newlyDetectedAssets = [...scannedSet]
    .filter(code => !existingCodes.has(code))
    .map(code => ({
      id: `new-${code}-${selectedLocation}`,
      assetCode: code,
      assetDesc: "-",
      parentAsset: "-",
      parentDescription: "-",
      lastUpdated: new Date().toISOString(),
      status: ASSET_STATUS.NEW
    }));

  return [
    ...updatedExistingAssets,
    ...existingNewAssets,
    ...newlyDetectedAssets
  ];
}