import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent
} from "@mui/material";

import { fetchAssetMetadata, fetchAssetsByZone, patchAssetRfidCode } from "../api/asset";
import { useUIStore } from "../store";

export default function NewAssetModal({
  open,
  onClose,
  rfidCode,
  onSuccess
}) {
  const showSnackbar=useUIStore((state) =>state.showSnackbar);

  const [metadata, setMetadata] = useState([]);
  const [building, setBuilding] = useState("");
  const [zone, setZone] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        const res = await fetchAssetMetadata();
        setMetadata(res || []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [open]);

  const buildings = [...new Set(metadata.map(m => m.location).filter(Boolean))];

  const zones = metadata
    .filter(m => m.location === building)
    .map(m => m.zone)
    .filter(Boolean);

  const handleSave = async () => {
    const orgCode = "TSUSHO";
    if (!assetCode || !rfidCode || !orgCode) {
      showSnackbar("Missing required fields", "error");
      return;
    }

    try {
      setLoading(true);

      const data = await patchAssetRfidCode(assetCode, orgCode, rfidCode);

      if (!data?.success) {
        throw new Error(data?.message || "Update failed");
      }

      showSnackbar(
        data?.message || "RFID updated successfully",
        "success"
      );

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Save asset RFID failed:", err);

      const msg =
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save RFID";

      showSnackbar(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBuilding("");
    setZone("");
    setAssetCode("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">

      <DialogTitle>Assign Asset RFID Code</DialogTitle>

      <DialogContent>

        {/* RFID */}
        <Card sx={{ mb: 2, background: "#e0e0e0" }}>
          <CardContent>
            <Typography fontWeight="bold" variant="body2">RFID Code</Typography>
            <Typography variant="body2">{rfidCode}</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Assign To:</Typography>
            <Typography variant="body2">{assetCode ?? "-"}</Typography>
          </CardContent>
        </Card>

        {/* BUILDING */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Building</InputLabel>
          <Select
            value={building}
            onChange={(e) => {
              setBuilding(e.target.value);
              setZone("");
              setAssetCode("");
            }}
          >
            {buildings.map(b => (
              <MenuItem key={b} value={b}>{b}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ZONE */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={!building}>
          <InputLabel>Zone</InputLabel>
          <Select
            value={zone}
            onChange={async (e) => {
                const selectedZone = e.target.value;

                setZone(selectedZone);
                setAssetCode("");
                setAssets([]);

                if (!selectedZone) return;

                setLoadingAssets(true);

                try {
                    const raw = await fetchAssetsByZone(selectedZone);
                    setAssets(raw || []);
                } catch (err) {
                    console.error("Failed to load assets by zone:", err);
                } finally {
                    setLoadingAssets(false);
                }
            }}
          >
            {[...new Set(zones)].map(z => (
              <MenuItem key={z} value={z}>{z}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ASSET */}
        <FormControl fullWidth size="small" disabled={!zone || loadingAssets}>
          <InputLabel>Asset</InputLabel>
            <Select
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
            >
                {loadingAssets ? (
                    <MenuItem disabled>
                        Loading assets...
                    </MenuItem>
                    ) : (
                    assets.map((a) => (
                        <MenuItem key={a.id} value={a.assetCode}>
                        {a.assetCode}
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>

      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!assetCode || loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Assign"}
        </Button>
      </DialogActions>

    </Dialog>
  );
}