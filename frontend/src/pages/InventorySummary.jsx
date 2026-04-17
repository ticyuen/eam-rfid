import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import AssetDetailsModal from "../components/AssetDetailsModal";
import { useWorkOrderStore } from "../store";
import { ASSET_SCAN_STATUS } from "../constants";

const InventorySummary = () => {
  const { id } = useParams();
  const { workOrders } = useWorkOrderStore();

  const workOrder = workOrders.find(
    (wo) => wo.id.toString() === id
  );

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  // ================================
  // FLATTEN ALL ZONE RESULTS
  // ================================
  const allAssets = useMemo(() => {
    if (!workOrder?.zoneResults) return [];

    const result = [];

    Object.entries(workOrder.zoneResults).forEach(
      ([zone, scans]) => {
        Object.values(scans).forEach((scan) => {
          (scan.assets || []).forEach((asset) => {
            result.push({
              ...asset,
              zone,
            });
          });
        });
      }
    );

    return result;
  }, [workOrder]);

  // ================================
  // STATUS META (same as Perform page)
  // ================================
  const getStatusMeta = (status) => {
    switch (status) {
      case ASSET_SCAN_STATUS.MATCHED:
        return {
          color: "#2e7d32",
          bg: "#e8f5e9",
          icon: <CheckCircleIcon fontSize="small" />,
          label: "Matched"
        };

      case ASSET_SCAN_STATUS.MISSING:
        return {
          color: "#ed6c02",
          bg: "#fff3e0",
          icon: <WarningAmberIcon fontSize="small" />,
          label: "Missing"
        };

      case ASSET_SCAN_STATUS.NEW:
        return {
          color: "#d32f2f",
          bg: "#fdecea",
          icon: <NewReleasesIcon fontSize="small" />,
          label: "New"
        };

      default:
        return {
          color: "#999",
          bg: "#f5f5f5",
          icon: null,
          label: "Unknown"
        };
    }
  };

  // ================================
  // FILTERED LIST
  // ================================
  const filteredAssets = useMemo(() => {
    if (!statusFilter) return allAssets;
    return allAssets.filter((a) => a.status === statusFilter);
  }, [allAssets, statusFilter]);

  // ================================
  // STATS
  // ================================
  const stats = useMemo(() => {
    const total = allAssets.length;
    const matched = allAssets.filter(
      (a) => a.status === ASSET_SCAN_STATUS.MATCHED
    ).length;
    const missing = allAssets.filter(
      (a) => a.status === ASSET_SCAN_STATUS.MISSING
    ).length;
    const newCount = allAssets.filter(
      (a) => a.status === ASSET_SCAN_STATUS.NEW
    ).length;

    return { total, matched, missing, newCount };
  }, [allAssets]);

  if (!workOrder) {
    return (
      <Typography sx={{ p: 2 }}>
        Work order not found
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* ================= HEADER ================= */}
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Inventory Summary
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        WO: {workOrder.id}
      </Typography>

      {/* ================= STATS ================= */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`Total: ${stats.total}`} />
        <Chip
          label={`Matched: ${stats.matched}`}
          color="success"
        />
        <Chip
          label={`Missing: ${stats.missing}`}
          color="warning"
        />
        <Chip label={`New: ${stats.newCount}`} color="error" />
      </Stack>

      {/* ================= FILTERS ================= */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          label="All"
          clickable
          onClick={() => setStatusFilter(null)}
          variant={!statusFilter ? "filled" : "outlined"}
        />

        <Chip
          label="Matched"
          color="success"
          clickable
          onClick={() =>
            setStatusFilter((p) =>
              p === ASSET_SCAN_STATUS.MATCHED
                ? null
                : ASSET_SCAN_STATUS.MATCHED
            )
          }
          variant={
            statusFilter === ASSET_SCAN_STATUS.MATCHED
              ? "filled"
              : "outlined"
          }
        />

        <Chip
          label="Missing"
          color="warning"
          clickable
          onClick={() =>
            setStatusFilter((p) =>
              p === ASSET_SCAN_STATUS.MISSING
                ? null
                : ASSET_SCAN_STATUS.MISSING
            )
          }
          variant={
            statusFilter === ASSET_SCAN_STATUS.MISSING
              ? "filled"
              : "outlined"
          }
        />

        <Chip
          label="New"
          color="error"
          clickable
          onClick={() =>
            setStatusFilter((p) =>
              p === ASSET_SCAN_STATUS.NEW ? null : ASSET_SCAN_STATUS.NEW
            )
          }
          variant={
            statusFilter === ASSET_SCAN_STATUS.NEW
              ? "filled"
              : "outlined"
          }
        />
      </Stack>

      {/* ================= CARDS ================= */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {filteredAssets.length === 0 && (
          <Typography>No assets found</Typography>
        )}

        {filteredAssets.map((asset) => {
          const meta = getStatusMeta(asset.scanStatus);

          return (
            <Card
              key={asset.id}
              sx={{
                borderRadius: 3,
                boxShadow: 2,
                borderLeft: `6px solid ${meta.color}`,
                backgroundColor: meta.bg,
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
                <Box>
                  <Typography fontWeight="bold">
                    {asset.description}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {asset.assetCode} • {asset.zone}
                  </Typography>

                  <Chip
                    icon={meta.icon}
                    label={meta.label}
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: meta.bg,
                      color: meta.color,
                      fontWeight: 600
                    }}
                  />
                </Box>

                {/* RIGHT ACTION */}
                <IconButton
                  onClick={() => {
                    setSelectedAsset(asset);
                    setOpenModal(true);
                  }}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "&:hover": { backgroundColor: "#e0e0e0" }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* ================= MODAL ================= */}
      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />
    </Box>
  );
};

export default InventorySummary;