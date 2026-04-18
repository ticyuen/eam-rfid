import { useState, useMemo } from "react";
import { Box, Typography, TextField, IconButton } from "@mui/material";
import CardList from "../components/CardList";
import AssetDetailsModal from "../components/AssetDetailsModal";
import { assetDetails } from "../mock/assetDetails";

export default function NearbyAssetsScan() {
  const [scanInput, setScanInput] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Update table when textarea changes
  const tableData = useMemo(() => {
    if (!scanInput.trim()) return [];

    const codes = [
      ...new Set(
        scanInput
          .split(/[\n,]+/)
          .map((c) => c.trim().toUpperCase())
          .filter((c) => c)
      ),
    ];

    return codes
      .map((code) =>
        assetDetails.find((a) => a.assetCode.toUpperCase() === code)
      )
      .filter(Boolean)
      .map((asset) => ({
        ...asset,
        id: `${asset.assetCode}-${asset.zone}`,
      }));
  }, [scanInput]);

  const handleInspect = (row) => {
    setSelectedAsset(row);
    setOpenModal(true);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Nearby Assets Scan
      </Typography>

      <CardList
        data={tableData}
        onInspect={handleInspect}
        renderContent={(asset) => (
          <>
            <Typography fontWeight="bold">
              {asset.assetCode}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {asset.description}
            </Typography>
          </>
        )}
      />

      <TextField
        label="Scan/Paste Asset Codes (comma or newline separated)"
        placeholder="Enter asset codes here..."
        multiline
        minRows={3}
        fullWidth
        sx={{ mt: 10, fontSize: 10 }}
        value={scanInput}
        autoFocus
        onChange={(e) => setScanInput(e.target.value)}
      />

      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />
    </Box>
  );
}