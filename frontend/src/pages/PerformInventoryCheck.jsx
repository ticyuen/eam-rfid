import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Box, Button, Typography, Chip, Card, CardContent, IconButton, FormControl, InputLabel, Select, MenuItem, Icon } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TagIcon from '@mui/icons-material/Tag';
import DescriptionIcon from "@mui/icons-material/Description"; 
import LocationOnIcon from "@mui/icons-material/LocationOn"; 
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import AddIcon from "@mui/icons-material/Add";
import SensorsIcon from '@mui/icons-material/Sensors';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import AssetDetailsModal from "../components/AssetDetailsModal";
import RfidScanModal from "../components/RfidScanModal";
import NewAssetModal from "../components/NewAssetModal";

import { processRFIDScanWithBackend } from "../services/rfidProcessor";
import { ASSET_SCAN_STATUS, WorkOrderStatus } from "../constants";
import { useWorkOrderStore } from "../store";
import { fetchAssetsByZone, mapAssets, scanAssetsByRfid } from "../api/asset";
import { fetchWorkOrderScanUUID, saveWorkOrderScanResult } from "../api/workOrderScan";
import { createWorkOrderScan } from "../api/workOrder";
import { getDeviceName } from "../utils/device";

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

const getIconColor = (status) => {
  switch (status) {
    case ASSET_SCAN_STATUS.MATCHED:
      return "success";
    case ASSET_SCAN_STATUS.MISSING:
      return "warning";
    case ASSET_SCAN_STATUS.NEW:
      return "error";
    default:
      return "primary";
  }
}

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

const getScanType = (status) => {
  if (status === WorkOrderStatus.FIRST_SCAN_IN_PROGRESS) return "firstScan";
  if (status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS) return "secondScan";
  return null;
};

const PerformInventoryCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { workOrders, updateStatus, completeZoneScan, updateZoneStatus } = useWorkOrderStore();

  const workOrder = workOrders.find((wo) => wo.id.toString() === id);

  const [tableData, setTableData] = useState([]);
  const [scanText, setScanText] = useState("");
  const [openScanModal, setOpenScanModal] = useState(false);
  const [openNewAsset, setOpenNewAsset] = useState(false);
  const [pendingRFID, setPendingRFID] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  const scanType = getScanType(workOrder?.status);

  const getInitialZone = (zones, scanType) => {
    if (!zones) return "";

    if (scanType === "firstScan") {
      return zones.find(z => Number(z.status) === 0)?.id || "";
    }

    if (scanType === "secondScan") {
      return zones.find(z => Number(z.status) < 2)?.id || "";
    }

    return "";
  };

  const [selectedZone, setSelectedZone] = useState(
    getInitialZone(workOrder?.zone, scanType)
  );
  const allZones = workOrder?.zone || [];

  const visibleAssets = useMemo(() => {
    let data = tableData;

    // Apply filter if selected
    if (statusFilter) {
      data = data.filter(a => a.scanStatus === statusFilter);
    }

    // Priority sorting
    const priority = {
      [ASSET_SCAN_STATUS.NEW]: 0,
      [ASSET_SCAN_STATUS.MISSING]: 1,
      // [ASSET_SCAN_STATUS.MATCHED]: 2
    };

    return [...data].sort(
      (a, b) => (priority[a.scanStatus] ?? 99) - (priority[b.scanStatus] ?? 99)
    );

  }, [tableData, statusFilter]);

  // Load assets per zone
  useEffect(() => {
    console.log("WO:", workOrder?.id, "zone:", selectedZone);
    const loadAssets = async () => {
      if (!selectedZone || !workOrder) return;

      // If already scanned before → use saved data
      const existing = workOrder.zoneResults?.[selectedZone]?.[scanType]?.assets;
      console.log(`${selectedZone} Assets data exist: ${existing}`)

      if (existing?.length) {
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
  }, [selectedZone, workOrder, scanType]);

  useEffect(() => {
    if (!workOrder) return;

    const initUUID = async () => {
      const store = useWorkOrderStore.getState();

      let uuid = store.getWorkOrderScanUUID(workOrder.id);

      if (!uuid) {
        uuid = await fetchWorkOrderScanUUID(workOrder.id);

        if (uuid) {
          store.setWorkOrderScanUUID(workOrder.id, uuid);
        }
      }
    };

    initUUID();
  }, [workOrder?.id]);

  const stats = useMemo(() => {
    let matched = 0;
    let missing = 0;
    let newCount = 0;

    tableData.forEach((a) => {
      if (a.scanStatus === ASSET_SCAN_STATUS.MATCHED) matched++;
      if (a.scanStatus === ASSET_SCAN_STATUS.MISSING) missing++;
      if (a.scanStatus === ASSET_SCAN_STATUS.NEW) newCount++;
    });

    return { matched, missing, new: newCount };
  }, [tableData]);

  const resolveWorkOrderScanUUID = async (workOrderId) => {
    const store = useWorkOrderStore.getState();

    // 1. Try store first
    let uuid = store.getWorkOrderScanUUID(workOrderId);

    // 2. Fetch only if missing
    if (!uuid) {
      uuid = await fetchWorkOrderScanUUID(workOrderId);

      if (uuid) {
        store.setWorkOrderScanUUID(workOrderId, uuid);
      }
    }

    return uuid;
  };

  const handleProcessScan = async (codes) => {
    if (!codes || codes.length === 0) {
      alert("No RFID detected");
      return;
    }

    try {
      const updated = await processRFIDScanWithBackend({
        existingTableData: tableData,
        scannedCodes: codes,
        selectedZone,
        scanAssetsByRfid
      });

      setTableData(updated);
      setOpenScanModal(false);

    } catch (err) {
      console.error(err);
    }
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

  const handleSave = async () => {
    const currentWO = workOrders.find(
      (wo) => wo.id.toString() === id
    );

    if (!currentWO) return;

    const workOrderScanUUID = await resolveWorkOrderScanUUID(currentWO.id);

    if (!workOrderScanUUID) {
      console.error("Missing workOrderScanUUID");
      return;
    }

    const scanSeq =
      scanType === "firstScan"
        ? 1
        : scanType === "secondScan"
        ? 2
        : 1;

    // Build payload
    const payloadAssets = tableData.map((asset) => {
      const isNewWithoutCode = !asset.assetCode || asset.assetCode === "NEW ASSET";

      return {
        assetCode: isNewWithoutCode ? "-" : asset.assetCode,
        assetStatus: asset.scanStatus,
        scanSeq,
        rfidCode: asset.rfidCode,
      };
    });

    console.log('PIC| payloadAssets: ', payloadAssets);

    try {
      const res = await saveWorkOrderScanResult({
        workOrderScanUUID: workOrderScanUUID,
        workOrderId: currentWO.id,
        zone: selectedZone,
        locationId: currentWO.locationId,
        assets: payloadAssets
      });

      console.log("Save Result Response:", res);

      // still keep existing local logic
      completeZoneScan(
        currentWO.id,
        selectedZone,
        scanType,
        tableData
      );

      updateZoneStatus(currentWO.id, selectedZone, scanType);

      const updatedWO = useWorkOrderStore.getState().workOrders.find(
        (wo) => wo.id === currentWO.id
      );

      // Check completion
      const allZonesDone = updatedWO.zone.every(
        (z) => Number(z.status) >= (scanType === "firstScan" ? 1 : 2)
      );

      if (allZonesDone) {
        const finalStatus =
          scanType === "firstScan"
            ? WorkOrderStatus.FIRST_SCAN_COMPLETED
            : WorkOrderStatus.SECOND_SCAN_COMPLETED;

        try {
          const deviceName = getDeviceName();

          await createWorkOrderScan({
            workOrderId: currentWO.id,
            status: finalStatus,
            deviceName,
            deviceIp: null,
            remark: ""
          });

          updateStatus(currentWO.id, finalStatus);

          navigate(`/inventory/summary/${currentWO.id}`);
        } catch (err) {
          console.error("Failed to update work order status:", err);
        }
        return;
      }

      const nextZone = updatedWO.zone.find(
        (z) => Number(z.status) < (scanType === "firstScan" ? 1 : 2)
      );

      if (nextZone) {
        setSelectedZone(nextZone.id);
      }

    } catch (err) {
      console.error("Save result failed:", err);
    }
  };

  const refreshSingleRFID = async (rfidCode) => {
    try {
      const res = await scanAssetsByRfid([rfidCode]);
      const resolved = res || [];

      if (resolved.length === 0) {
        return;
      }

      const updatedAsset = resolved[0];

      setTableData(prev => {
        const map = new Map(
          prev.map(a => [a.rfidCode?.toUpperCase(), a])
        );

        const code = rfidCode.toUpperCase();

        map.set(code, {
          ...map.get(code),
          ...updatedAsset
        });

        return Array.from(map.values());
      });

    } catch (err) {
      console.error("Failed to refresh RFID after assignment:", err);
    }
  };

  const toggleFilter = (status) => setStatusFilter(prev => (prev === status ? null : status));

  if (!workOrder) return <Typography>Work order not found</Typography>;

  return (
    <Box sx={{ p: 1 }}>
      {/* HEADER */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Perform Inventory Check
      </Typography>

      <Typography variant="body2">
        <strong>Work Order: </strong> {workOrder.id}
      </Typography>

      <Typography variant="body2">
        <strong>Work Order Status: </strong> {workOrder.status}
      </Typography>

      <FormControl fullWidth size="small" sx={{ mt: 2, mb: 2 }}>
        <InputLabel>zone</InputLabel>
        <Select
          value={selectedZone}
          label="zone"
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          {
            allZones.map((zone) => {
              const statusNum = Number(zone.status);

              const isFirstScanDone = statusNum >= 1;
              const isSecondScanDone = statusNum >= 2;

              return (
                <MenuItem
                  key={zone.id}
                  value={zone.id}
                  disabled={
                    scanType === "firstScan"
                      ? isFirstScanDone
                      : scanType === "secondScan"
                      ? isSecondScanDone
                      : false
                  }
                >
                  {zone.id}
                  {scanType === "firstScan" && isFirstScanDone && " ✔"}
                  {scanType === "secondScan" && isSecondScanDone && " ✔"}
                </MenuItem>
              );
            })
          }
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", gap: 1 }}>

        <Button 
          sx={{
            height: 40,
            // fontSize: 16,
            // fontWeight: "bold"
          }}
          fullWidth 
          variant="outlined" 
          color="error"
          onClick={handleReset}
        >
          <RestartAltIcon sx={{ mr: 1 }} /> Reset
        </Button>

        <Button 
          sx={{
            height: 40,
            // fontSize: 16,
            // fontWeight: "bold"
          }}
          fullWidth 
          variant="contained" 
          onClick={handleSave}
        >
          <SaveIcon sx={{ mr: 1 }} /> Save Result
        </Button>

      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 4 }}>

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
          <SensorsIcon sx={{ mr: 1 }} /> Scan RFID
        </Button>

      </Box>

      {/* COUNTERS */}
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
              borderLeft: `6px solid ${getStatusMeta(asset.scanStatus).color}`,
              backgroundColor: getCardColor(asset.scanStatus),
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
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>

              {/* LEFT CONTENT */}
              <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>

                {/* ASSET CODE */}
                <Box display="flex" alignItems="center" gap={1}>
                  <TagIcon fontSize="small" color={getIconColor(asset.scanStatus)} />
                  <Typography fontWeight="bold" fontSize={16}>
                    {asset.assetCode || "NEW ASSET"}
                  </Typography>
                </Box>

                {/* DESCRIPTION */}
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <DescriptionIcon fontSize="small" color={getIconColor(asset.scanStatus)} />
                  <Typography variant="caption" color="text.secondary">
                    {(asset.assetCode) ? asset.description : asset.rfidCode}
                  </Typography>
                </Box>

                {/* ZONE */}
                {asset.zone && asset.zone === selectedZone && (
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" color={getIconColor(asset.scanStatus)} />
                    <Typography variant="caption">
                      {asset.zone}
                    </Typography>
                  </Box>
                )}

                {/* BELONGS TO OTHER ZONE */}
                {asset.zone && asset.zone !== selectedZone && (
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" color={getIconColor(asset.scanStatus)} />
                    <Typography variant="body2" color={getIconColor(asset.scanStatus)}>
                      <strong>Belongs to {asset.zone}</strong>
                    </Typography>
                  </Box>
                )}

                {/* STATUS CHIP */}
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
              </Box>

              {/* RIGHT ACTION */}
              {asset.assetCode === undefined ? (
                <IconButton
                  onClick={() => {
                    setPendingRFID(asset.rfidCode);
                    setOpenNewAsset(true);
                  }}
                >
                  <AddIcon color={getIconColor(asset.scanStatus)} />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => {
                    setSelectedAsset(asset);
                    setOpenAssetModal(true);
                  }}
                >
                  <SearchIcon color={getIconColor(asset.scanStatus)} />
                </IconButton>
              )}

            </CardContent>
          </Card>
        ))}
      </Box>

      <RfidScanModal
        open={openScanModal}
        value={scanText}
        onChange={(e) => setScanText(e.target.value)}
        onClose={() => setOpenScanModal(false)}
        onProcess={handleProcessScan}
      />

      <AssetDetailsModal
        open={openAssetModal}
        asset={selectedAsset}
        onClose={() => setOpenAssetModal(false)}
      />

      <NewAssetModal
        open={openNewAsset}
        rfidCode={pendingRFID}
        onClose={() => setOpenNewAsset(false)}
        onSuccess={async () => {
          setOpenNewAsset(false);
          setPendingRFID(null);

          if (pendingRFID) {
            await refreshSingleRFID(pendingRFID);
          }
        }}
      />
    </Box>
  );
};

export default PerformInventoryCheck;