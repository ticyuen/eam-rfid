import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import AssetDetailsModal from "../components/AssetDetailsModal";
import { useWorkOrderStore } from "../store";
import { ASSET_SCAN_STATUS, WorkOrderStatus } from "../constants";

const InventorySummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { workOrders } = useWorkOrderStore();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedWOId, setSelectedWOId] = useState(id || "");

  const workOrder = workOrders.find((wo) => wo?.id.toString() === selectedWOId);

  const completedWorkOrders = workOrders.filter(
    (wo) =>
      wo.status === WorkOrderStatus.FIRST_SCAN_COMPLETED ||
      wo.status === WorkOrderStatus.SECOND_SCAN_COMPLETED
  );

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

  // useEffect(() => {
  //   if (selectedWOId) {
  //     navigate(`/inventory/summary/${selectedWOId}`, { replace: true });
  //   }
  // }, [selectedWOId]);

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
        return {};
    }
  };

  const getCardColor = (status) => {
    switch (status) {
      case ASSET_SCAN_STATUS.MATCHED:
        return "#fafffa";
      case ASSET_SCAN_STATUS.MISSING:
        return "#fcf9f5";
      case ASSET_SCAN_STATUS.NEW:
        return "#fff9f8";
      default:
        return "#ffffff";
    }
  };

  const toggleFilter = (status) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  // FILTERED LIST
  const filteredAssets = useMemo(() => {
    if (!statusFilter) return allAssets;
    return allAssets.filter((a) => a.scanStatus === statusFilter);
  }, [allAssets, statusFilter]);

  // STATS
  const stats = useMemo(() => {
    const total = allAssets.length;
    const matched = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.MATCHED
    ).length;
    const missing = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.MISSING
    ).length;
    const newCount = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.NEW
    ).length;

    return { total, matched, missing, newCount };
  }, [allAssets]);

  // if (!workOrder) {
  //   return (
  //     <Typography sx={{ p: 2 }}>
  //       Work order not found
  //     </Typography>
  //   );
  // }

  return (
    <Box sx={{ p: 1 }}>
      {/* ================= HEADER ================= */}
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Inventory Summary
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        WO: {workOrder?.id}
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Work Order</InputLabel>
        <Select
          value={selectedWOId}
          label="Work Order"
          onChange={(e) => setSelectedWOId(e.target.value)}
        >
          {completedWorkOrders.map((wo) => (
            <MenuItem key={wo.id} value={wo.id}>
              {wo.id} - {wo.status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>

        {/* MATCHED */}
        <Box
          onClick={() => toggleFilter(ASSET_SCAN_STATUS.MATCHED)}
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_SCAN_STATUS.MATCHED ? "#e8f5e9" : "#fff",
            cursor: "pointer",
            boxShadow: 1,
            position: "sticky", top: 0, zIndex: 2
          }}
        >
          <Typography variant="caption">Matched</Typography>
          <Typography fontWeight="bold" color="success.main">
            {stats.matched}
          </Typography>
        </Box>

        {/* MISSING */}
        <Box
          onClick={() => toggleFilter(ASSET_SCAN_STATUS.MISSING)}
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_SCAN_STATUS.MISSING ? "#fff3e0" : "#fff",
            cursor: "pointer",
            boxShadow: 1
          }}
        >
          <Typography variant="caption">Missing</Typography>
          <Typography fontWeight="bold" color="warning.main">
            {stats.missing}
          </Typography>
        </Box>

        {/* NEW */}
        <Box
          onClick={() => toggleFilter(ASSET_SCAN_STATUS.NEW)}
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_SCAN_STATUS.NEW ? "#fdecea" : "#fff",
            cursor: "pointer",
            boxShadow: 1
          }}
        >
          <Typography variant="caption">New</Typography>
          <Typography fontWeight="bold" color="error.main">
            {stats.newCount}
          </Typography>
        </Box>

      </Box>

      {/* ================= CARDS ================= */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {filteredAssets.length === 0 && (
          <Typography>No assets found</Typography>
        )}

        {filteredAssets.map((asset) => {
          return (
            <Card
              key={asset.id}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: 3,
                borderLeft: `6px solid ${getStatusMeta(asset.scanStatus).color}`,
                backgroundColor: getCardColor(asset.scanStatus),
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>

                  <Typography fontWeight="bold">
                    {asset.assetCode || "NEW ASSET"}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {asset.description || asset.rfidCode}
                  </Typography>

                  <Typography variant="caption">
                    Zone: {asset.zone}
                  </Typography>

                  <Chip
                    icon={getStatusMeta(asset.scanStatus).icon}
                    label={getStatusMeta(asset.scanStatus).label}
                    size="small"
                    sx={{
                      mt: 1,
                      alignSelf: "start",
                      backgroundColor: getStatusMeta(asset.scanStatus).bg,
                      color: getStatusMeta(asset.scanStatus).color,
                      fontWeight: 600
                    }}
                  />
                </Box>

                <IconButton onClick={() => {
                  setSelectedAsset(asset);
                  setOpenModal(true);
                }}>
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