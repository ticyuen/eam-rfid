import { useState, useEffect, useRef } from "react";
import { 
  Box, Typography, TextField, IconButton,
  Card,
  CardContent,
  Button,
  Chip
} from "@mui/material";

import TagIcon from "@mui/icons-material/Tag";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import AssetDetailsModal from "../components/AssetDetailsModal";
import NewAssetModal from "../components/NewAssetModal";

import { scanAssetsByRfid } from "../api/asset";
import { ASSET_SCAN_STATUS } from "../constants";

const getCardColor = (status) => {
  switch (status) {
    case ASSET_SCAN_STATUS.MATCHED:
      return "#fafffa";
    case ASSET_SCAN_STATUS.NEW:
      return "#fff9f8";
    default:
      return "#ffffff";
  }
};

const getStatusMeta = (status) => {
  switch (status) {
    case ASSET_SCAN_STATUS.NEW:
      return {
        color: "#d32f2f",
        bg: "#fdecea",
        icon: <NewReleasesIcon fontSize="small" />,
        label: "New"
      };
    default:
      return {
        color: "#004b8f",
        bg: "#9bb9dd",
        icon: <NewReleasesIcon fontSize="small" />,
        label: "New"
      };
  }
};

const isNewAsset = (asset) => asset.isNew === true;

export default function NearbyAssets() {
  const scanInputRef = useRef(null);
  const [scanInput, setScanInput] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openNewAsset, setOpenNewAsset] = useState(false);
  const [pendingRFID, setPendingRFID] = useState(null);

  const handleScan = async () => {
    if (!scanInput.trim()) return;

    setLoading(true);

    try {
      const codes = [
        ...new Set(
          scanInput
            .split(/[\n,]+/)
            .map(c => c.trim().toUpperCase())
            .filter(c => c.length >= 24)
            .filter(Boolean)
        )
      ];
      
      if (codes?.length > 0) {
        const res = await scanAssetsByRfid(codes);
        const found = res || [];

        const foundCodes = new Set(
          found.map(a => (a.rfidCode || "").toUpperCase())
        );

        const newAssets = codes
          .filter(code => !foundCodes.has(code))
          .map(code => ({
            id: `new-${code}`,
            rfidCode: code,
            assetCode: "NEW ASSET",
            description: code,
            zone: "-",
            scanStatus: ASSET_SCAN_STATUS.NEW,
            isNew: true
          }));

        setAssets([...found, ...newAssets]);
      }
    } catch (err) {
      console.error("RFID scan failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (scanInput) handleScan();
    }, 500);

    return () => clearTimeout(timeout);
  }, [scanInput]);

  const handleInspect = (asset) => {
    setSelectedAsset(asset);
    setOpenModal(true);
  };

  const handleReset = () => {
    setScanInput("");
    setAssets([]);
    // small delay ensures DOM updates before focus
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 0);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold">
        Nearby Assets Scan
      </Typography>

      <TextField
        inputRef={scanInputRef}
        label="RFID Codes"
        placeholder="Enter RFID codes (separate by newline)"
        multiline
        minRows={3}
        fullWidth
        autoFocus
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value)}
        sx={{ mt: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>

        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleReset}
          disabled={loading}
          // sx={{ height: 48 }}
        >
          <RestartAltIcon sx={{ mr: 1 }} /> Reset
        </Button>

      </Box>

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {/* {assets.length === 0 && !loading && (
          <Typography>No assets found</Typography>
        )} */}
      
        <Typography variant="body1" sx={{ mt: 2 }}>
          Found Assets: {assets.length ?? 0}
        </Typography>

        {assets.map((asset, idx) => (
          <Card
            key={`${asset.id}-${idx}`}
            sx={{
              borderRadius: 3,
              boxShadow: 2,
              borderLeft: `6px solid ${getStatusMeta(asset.scanStatus).color}`,
              backgroundColor: getCardColor(asset.scanStatus),
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4
              }
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              {/* LEFT */}
              <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>

                <Box display="flex" alignItems="center" gap={1}>
                  <TagIcon fontSize="small" sx={{ color: getStatusMeta(asset.scanStatus).color }} />
                  <Typography fontWeight="bold">
                    {asset.assetCode || ""}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <DescriptionIcon fontSize="small" sx={{ color: getStatusMeta(asset.scanStatus).color }} />
                  <Typography variant="body2" color="text.secondary">
                    {asset.description || "-"}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: getStatusMeta(asset.scanStatus).color }} />
                  <Typography variant="caption">
                    {asset.zone || "-"}
                  </Typography>
                </Box>

                {/* STATUS CHIP */}
                {isNewAsset(asset) && (
                  <Chip
                    icon={getStatusMeta(asset.scanStatus).icon}
                    label={getStatusMeta(asset.scanStatus).label}
                    size="small"
                    component="div"
                    sx={{
                      mt: 1.5,
                      alignSelf: "start",
                      backgroundColor: getStatusMeta(asset.scanStatus).bg,
                      color: getStatusMeta(asset.scanStatus).color,
                      fontWeight: 600
                    }}
                  />
                )}

              </Box>

              {/* RIGHT */}
              {isNewAsset(asset) ? (
                <IconButton 
                  onClick={() => {
                    setPendingRFID(asset.rfidCode);
                    setOpenNewAsset(true);
                  }}
                >
                  <AddIcon color="error" />
                </IconButton>
              ) : (
                <IconButton onClick={() => handleInspect(asset)}>
                  <SearchIcon color="primary" />
                </IconButton>
              )}

            </CardContent>
          </Card>
        ))}
      </Box>

      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />

      <NewAssetModal
        open={openNewAsset}
        rfidCode={pendingRFID}
        onClose={() => setOpenNewAsset(false)}
        onSuccess={() => {
          // re-trigger scan or refresh list
          if (scanInput.trim()) {
            setScanInput(prev => prev);
          }
        }}
      />
    </Box>
  );
}