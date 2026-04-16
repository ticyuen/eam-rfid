import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Box, Button, Typography, Chip, Card, CardContent, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import AssetDetailsModal from "../components/AssetDetailsModal";
import RfidScanModal from "../components/RfidScanModal";

import { processRFIDScan } from "../services/rfidProcessor";
import { ASSET_STATUS, WorkOrderStatus } from "../constants";
import { useWorkOrderStore } from "../store";
import { fetchAssetsByZone, mapAssets } from "../api/asset";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

const getScanType = (status) => {
  if (status === WorkOrderStatus.FIRST_SCAN_IN_PROGRESS) return "firstScan";
  if (status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS) return "secondScan";
  return null;
};

const PerformInventoryCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { workOrders, updateStatus, completeZoneScan } = useWorkOrderStore();

  const workOrder = workOrders.find((wo) => wo.id.toString() === id);

  const [tableData, setTableData] = useState([]);
  const [scanText, setScanText] = useState("");

  const [openScanModal, setOpenScanModal] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  const [selectedZone, setSelectedZone] = useState(
    workOrder?.zone?.[0] || ""
  );

  const scanType = getScanType(workOrder?.status);
  const allZones = workOrder?.zone || [];

  const visibleAssets = useMemo(() => {
    let data = tableData;

    // Apply filter if selected
    if (statusFilter) {
      data = data.filter(a => a.status === statusFilter);
    }

    // Priority sorting
    const priority = {
      [ASSET_STATUS.NEW]: 0,
      [ASSET_STATUS.MISSING]: 1,
      // [ASSET_STATUS.MATCHED]: 2
    };

    return [...data].sort(
      (a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
    );

  }, [tableData, statusFilter]);

  /**
   * Load assets per zone
   */
  useEffect(() => {
    console.log('WO: ', workOrder)
    console.log(`zone: ${selectedZone}`)
    const loadAssets = async () => {
      if (!selectedZone || !workOrder) return;

      // If already scanned before → use saved data
      const existing = workOrder.zoneResults?.[selectedZone]?.[scanType]?.assets;
      console.log(`${selectedZone} Assets data exist: ${existing}`)

      if (existing) {
        setTableData(existing);
        return;
      }

      try {
        const raw = await fetchAssetsByZone(selectedZone);

        const mapped = mapAssets(raw, selectedZone);

        setTableData(mapped);

      } catch (err) {
        console.error("Failed to fetch assets:", err);
      }
    };

    loadAssets();
  }, [selectedZone, workOrder]);

  /**
   * COUNTERS
   */
  const stats = useMemo(() => {
    let matched = 0;
    let missing = 0;
    let newCount = 0;

    tableData.forEach((a) => {
      if (a.status === ASSET_STATUS.MATCHED) matched++;
      if (a.status === ASSET_STATUS.MISSING) missing++;
      if (a.status === ASSET_STATUS.NEW) newCount++;
    });

    return { matched, missing, new: newCount };
  }, [tableData]);

  // PROCESS SCAN
  const handleProcessScan = (codes) => {
    if (!codes || codes.length === 0) {
      alert("No RFID detected");
      return;
    }

    const updated = processRFIDScan(
      tableData,
      codes,
      selectedZone
    );

    setTableData(updated);
    setOpenScanModal(false);
  };

  const handleReset = async () => {
    if (!selectedZone) return;

    const confirm = window.confirm(
      "Are you sure you want to reset this scan? All progress will be lost."
    );

    if (!confirm) return;

    try {
      const raw = await fetchAssetsByZone(selectedZone);
      const resetData = mapAssets(raw, selectedZone); 
      setTableData(resetData);
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  const handleSave = () => {
    const currentWO = workOrders.find(
      (wo) => wo.id.toString() === id
    );

    if (!currentWO) return;

    completeZoneScan(
      currentWO.id,
      selectedZone,
      scanType,
      tableData
    );

    const updated = {
      ...currentWO,
      zoneResults: {
        ...currentWO.zoneResults,
        [selectedZone]: {
          ...currentWO.zoneResults?.[selectedZone],
          [scanType]: {
            completed: true,
            assets: tableData,
          },
        },
      },
    };

    const next = currentWO.zone.find(
      (loc) => !updated.zoneResults?.[loc]?.[scanType]?.completed
    );

    if (!next) {
      updateStatus(
        currentWO.id,
        scanType === "firstScan"
          ? WorkOrderStatus.FIRST_SCAN_COMPLETED
          : WorkOrderStatus.SECOND_SCAN_COMPLETED
      );

      navigate(`/inventory/summary/${currentWO.id}`);
      return;
    }

    setSelectedZone(next);
  };

  const getCardColor = (status) => {
    switch (status) {
      case ASSET_STATUS.MATCHED:
        return "#fafffa"; // soft green
      case ASSET_STATUS.MISSING:
        return "#fcf9f5"; // soft amber
      case ASSET_STATUS.NEW:
        return "#fff9f8"; // soft red
      default:
        return "#ffffff";
    }
  };
  
  const getStatusMeta = (status) => {
    switch (status) {
      case ASSET_STATUS.MATCHED:
        return {
          color: "#2e7d32",
          bg: "#e8f5e9",
          icon: <CheckCircleIcon fontSize="small" />,
          label: "Matched"
        };
      case ASSET_STATUS.MISSING:
        return {
          color: "#ed6c02",
          bg: "#fff3e0",
          icon: <WarningAmberIcon fontSize="small" />,
          label: "Missing"
        };
      case ASSET_STATUS.NEW:
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

  if (!workOrder) return <Typography>Work order not found</Typography>;

  return (
    <Box sx={{ p: 1 }}>
      {/* HEADER */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Perform Inventory Check
      </Typography>

      <Typography variant="body2">
        <strong>WO: </strong> {workOrder.id}
      </Typography>

      <Typography variant="body2">
        <strong>WO Status: </strong> {workOrder.status}
      </Typography>

      <FormControl fullWidth size="small" sx={{ mt: 2, mb: 2 }}>
        <InputLabel>zone</InputLabel>
        <Select
          value={selectedZone}
          label="zone"
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          {allZones.map((zone) => (
            <MenuItem key={zone} value={zone}>
              {zone}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", gap: 1, mb: 4 }}>

        <Button 
          sx={{
            height: 56,
            fontSize: 16,
            fontWeight: "bold"
          }}
          fullWidth 
          variant="outlined" 
          color="error" 
          onClick={handleReset}
        >
          🔄 Reset
        </Button>

        <Button 
          sx={{
            height: 56,
            fontSize: 16,
            fontWeight: "bold"
          }}
          fullWidth 
          variant="contained" 
          onClick={handleSave}
        >
          💾 Save
        </Button>

      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 4 }}>

        <Button 
          sx={{
            height: 56,
            fontSize: 16,
            fontWeight: "bold"
          }}
          fullWidth 
          variant="contained" 
          onClick={() => setOpenScanModal(true)}
        >
          📡 Scan RFID
        </Button>

      </Box>

      {/* <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 4 }}>
        <Button
          variant="contained"
          // size="large"
          // fullWidth
          sx={{
            height: 56,
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 3,
            boxShadow: 4
          }}
          onClick={() => setOpenScanModal(true)}
        >
          📡 Scan RFID
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            height: 56,
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 3,
            boxShadow: 4
          }}
        >
          💾 Save Result
        </Button>
      </Box> */}

      {/* COUNTERS */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>

        {/* ALL */}
        {/* <Box
          onClick={() => setStatusFilter(null)}
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor: statusFilter === null ? "#e3f2fd" : "#fff",
            cursor: "pointer",
            boxShadow: 1
          }}
        >
          <Typography variant="caption">All</Typography>
          <Typography fontWeight="bold">{tableData.length}</Typography>
        </Box> */}

        {/* MATCHED */}
        <Box
          onClick={() =>
            setStatusFilter(prev =>
              prev === ASSET_STATUS.MATCHED ? null : ASSET_STATUS.MATCHED
            )
          }
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_STATUS.MATCHED ? "#e8f5e9" : "#fff",
            cursor: "pointer",
            boxShadow: 1
          }}
        >
          <Typography variant="caption">Matched</Typography>
          <Typography fontWeight="bold" color="success.main">
            {stats.matched}
          </Typography>
        </Box>

        {/* MISSING */}
        <Box
          onClick={() =>
            setStatusFilter(prev =>
              prev === ASSET_STATUS.MISSING ? null : ASSET_STATUS.MISSING
            )
          }
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_STATUS.MISSING ? "#fff3e0" : "#fff",
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
          onClick={() =>
            setStatusFilter(prev =>
              prev === ASSET_STATUS.NEW ? null : ASSET_STATUS.NEW
            )
          }
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor:
              statusFilter === ASSET_STATUS.NEW ? "#fdecea" : "#fff",
            cursor: "pointer",
            boxShadow: 1
          }}
        >
          <Typography variant="caption">New</Typography>
          <Typography fontWeight="bold" color="error.main">
            {stats.new}
          </Typography>
        </Box>

      </Box>

      {/* CARDS */}
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {visibleAssets.length === 0 && (
          <Typography sx={{ mt: 2 }}>
            No data
          </Typography>
        )}
        {visibleAssets.map((asset) => (
          <Card
            key={asset.id}
            sx={{
              borderRadius: 3,
              background: "#fff",
              boxShadow: 3,
              borderLeft: `6px solid ${getStatusMeta(asset.status).color}`,
              backgroundColor: getCardColor(asset.status),
              transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4
                },
                "&:active": {
                  transform: "scale(0.98)"
                }
            }}
          >
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

              {/* LEFT CONTENT */}
              <Box>
                {/* MAIN: DESCRIPTION */}
                <Typography fontWeight="bold" fontSize={16}>
                  {asset.assetCode || "NEW Asset"}
                </Typography>

                {/* secondary: asset code */}
                <Typography component="div" variant="caption" color="text.secondary">
                  {asset.assetDesc}
                </Typography>

                {/* status chip */}
                <Chip
                  icon={getStatusMeta(asset.status).icon}
                  label={getStatusMeta(asset.status).label}
                  size="small"
                  component="div"
                  sx={{
                    mt: 1,
                    backgroundColor: getStatusMeta(asset.status).bg,
                    color: getStatusMeta(asset.status).color,
                    fontWeight: 600
                  }}
                />
              </Box>

              {/* RIGHT ACTION */}
              <IconButton
                onClick={() => {
                  setSelectedAsset(asset);
                  setOpenAssetModal(true);
                }}
                sx={{
                  backgroundColor: "transparent"
                }}
              >
                <SearchIcon />
              </IconButton>

            </CardContent>
          </Card>
        ))}
      </Box>

      {/* SCAN MODAL */}
      <RfidScanModal
        open={openScanModal}
        value={scanText}
        onChange={(e) => setScanText(e.target.value)}
        onClose={() => setOpenScanModal(false)}
        onProcess={handleProcessScan}
      />

      {/* DETAIL MODAL */}
      <AssetDetailsModal
        open={openAssetModal}
        asset={selectedAsset}
        onClose={() => setOpenAssetModal(false)}
      />
    </Box>
  );
};

export default PerformInventoryCheck;