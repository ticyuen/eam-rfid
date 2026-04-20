import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  InputLabel,
  Button,
  TextField
} from "@mui/material";

import TagIcon from '@mui/icons-material/Tag';
import DescriptionIcon from "@mui/icons-material/Description"; 
import LocationOnIcon from "@mui/icons-material/LocationOn"; 
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import AssetDetailsModal from "../components/AssetDetailsModal";
import { useWorkOrderStore } from "../store";
import { ASSET_SCAN_STATUS, WorkOrderStatus } from "../constants";
import { fetchWorkOrderScanAssets, saveWorkOrderScanResult } from "../api/workOrderScan";
import { createWorkOrderScan } from "../api/workOrder";
import { getDeviceName } from "../utils/device";

const InventorySummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workOrders, updateStatus } = useWorkOrderStore();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("NON_MATCHED");
  const [selectedWOId, setSelectedWOId] = useState(id || "");
  const [editedAssets, setEditedAssets] = useState({});
  const [originalAssets, setOriginalAssets] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [apiAssets, setApiAssets] = useState([]);
  const allAssets = apiAssets;

  const workOrder = workOrders.find((wo) => wo?.id.toString() === selectedWOId);

  const isSecondScan =
    workOrder?.status === WorkOrderStatus.SECOND_SCAN_COMPLETED ||
    workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS;

  const scanSeq = isSecondScan ? 2 : 1

  const completedWorkOrders = workOrders.filter(
    (wo) =>
      wo.status === WorkOrderStatus.FIRST_SCAN_COMPLETED ||
      wo.status === WorkOrderStatus.SECOND_SCAN_COMPLETED
  );

  const reloadAssets = async () => {
    if (!selectedWOId || !workOrder) return;

    try {
      const data = await fetchWorkOrderScanAssets({
        workOrderId: selectedWOId,
        scanSeq
      });

      const mapped = data.map((a, index) => ({
        id: a.assetCode,

        assetCode: a.assetCode,
        description: a.description,

        zone: a.zone,
        zoneCode: a.zoneCode,
        currentZoneCode: a.currentZoneCode,

        rfidCode: a.rfidCode,
        scanStatus: a.scanStatus,
        scanSeq: a.scanSeq,

        workOrderId: a.workOrderId,
        workOrderScanUuid: a.workOrderScanUuid,

        remark: a.remark || "",
        isEdited: false
      }));

      const cloned = JSON.parse(JSON.stringify(mapped));

      setApiAssets(cloned);
      setOriginalAssets(cloned);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadAssets();
  }, [selectedWOId, workOrder?.status]);

  const handleMarkAsMatched = (asset) => {
    // Update UI immediately
    setApiAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? { ...a, scanStatus: ASSET_SCAN_STATUS.MATCHED }
          : a
      )
    );

    // Track change
    setEditedAssets((prev) => ({
      ...prev,
      [asset.assetCode]: ASSET_SCAN_STATUS.MATCHED
    }));
  };

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

  const handleRemarkChange = (assetCode, value) => {
    setRemarks(prev => ({
      ...prev,
      [assetCode]: value
    }));

    setEditedAssets(prev => ({
      ...prev,
      [assetCode]: true
    }));
  };

  const handleReset = () => {
    if (originalAssets.length === 0) return;

    const confirmReset = window.confirm(
      "Reset all changes? This will discard unsaved edits."
    );

    if (!confirmReset) return;

    // restore original assets
    setApiAssets(originalAssets);

    // clear edit tracking
    setEditedAssets({});

    // IMPORTANT: clear remarks too
    setRemarks({});
  };

  const toggleFilter = (status) => {
    setStatusFilter((prev) =>
      prev === status ? "NON_MATCHED" : status
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedWOId) return;

    const changedList = Object.entries(editedAssets);
    const hasRemarkChanges = Object.keys(remarks).length > 0;

    if (changedList.length === 0 && !hasRemarkChanges) {
      alert("No changes to save");
      return;
    }

    console.log("remarks state:", remarks);

    try {
      const changedAssetObjects = allAssets.filter((a) => {
        return (
          editedAssets[a.assetCode] === true ||
          remarks[a.assetCode]?.length > 0
        );
      });

      console.log('changedAssetObjects: ', changedAssetObjects);

      if (changedAssetObjects.length === 0) return;

      // 1. Get UUID (same for all)
      const workOrderScanUuid =
        changedAssetObjects[0]?.workOrderScanUuid;

      if (!workOrderScanUuid) {
        console.error("Missing workOrderScanUuid");
        return;
      }

      // 2. Group assets by zone
      const groupedByZone = changedAssetObjects.reduce((acc, asset) => {
        const zone = asset.zoneCode;

        if (!zone) return acc;

        if (!acc[zone]) acc[zone] = [];

        acc[zone].push({
          assetCode: asset.assetCode,
          assetStatus: asset.scanStatus,
          scanSeq,
          remark: remarks[asset.assetCode] || asset.remark || ""
        });

        return acc;
      }, {});

      // 3. Call API per zone
      const promises = Object.entries(groupedByZone).map(
        ([zone, assets]) =>
          saveWorkOrderScanResult({
            workOrderScanUUID: workOrderScanUuid,
            zone,
            assets
          })
      );

      await Promise.all(promises);

      // 4. Reset & reload
      setEditedAssets({});
      await reloadAssets();

    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleStartSecondScan = async () => {
    if (!selectedWOId) return;

    try {
      const deviceName = getDeviceName();

      // 1. Call backend to update status
      await createWorkOrderScan({
        workOrderId: selectedWOId,
        status: WorkOrderStatus.SECOND_SCAN_IN_PROGRESS,
        deviceName,
        deviceIp: null,
        remark: ""
      });

      // 2. Update local store
      updateStatus(selectedWOId, WorkOrderStatus.SECOND_SCAN_IN_PROGRESS);

      // 3. Navigate to PerformInventoryCheck (2nd scan)
      navigate(`/inventory/perform/${selectedWOId}`);

    } catch (err) {
      console.error("Failed to start 2nd scan:", err);
    }
  };

  const handleSubmitFinal = async () => {
    if (!selectedWOId) return;

    try {
      const deviceName = getDeviceName();

      await createWorkOrderScan({
        workOrderId: selectedWOId,
        status: WorkOrderStatus.JOB_DONE,
        deviceName,
        deviceIp: null,
        remark: ""
      });

      updateStatus(selectedWOId, WorkOrderStatus.JOB_DONE);

      alert("Work Order submitted successfully");

    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const getSecondScanButtonText = () => {
    if (!workOrder) return "Start 2nd Scan";

    switch (workOrder.status) {
      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        return "Submit";

      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        return "Continue 2nd Scan";

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
      default:
        return "Start 2nd Scan";
    }
  };

  const filteredAssets = useMemo(() => {
    let data = allAssets;

    // Default: hide MATCHED
    if (statusFilter === "NON_MATCHED") {
      data = data.filter(
        (a) => a.scanStatus !== ASSET_SCAN_STATUS.MATCHED
      );
    }

    // Specific filter (when user taps)
    if (
      statusFilter &&
      statusFilter !== "NON_MATCHED"
    ) {
      data = data.filter(
        (a) => a.scanStatus === statusFilter
      );
    }

    // Always sort: NEW → MISSING → MATCHED
    const priority = {
      [ASSET_SCAN_STATUS.NEW]: 0,
      [ASSET_SCAN_STATUS.MISSING]: 1,
      [ASSET_SCAN_STATUS.MATCHED]: 2,
    };

    return [...data].sort(
      (a, b) =>
        (priority[a.scanStatus] ?? 99) -
        (priority[b.scanStatus] ?? 99)
    );
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

      <Typography variant="body2">
        Work Order: {workOrder?.id}
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Work Order Status: {workOrder?.status}
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

      <Box sx={{ display: "flex", gap: 1 }}>
      
        <Button 
          sx={{ height: 40 }}
          fullWidth 
          variant="outlined" 
          color="error"
          onClick={handleReset}
        >
          🔄 Reset
        </Button>

        <Button 
          sx={{
            height: 40,
            // fontSize: 16,
            // fontWeight: "bold"
          }}
          fullWidth 
          variant="contained" 
          onClick={handleSaveChanges}
        >
          💾 Save Changes
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
          disabled={workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS}
          onClick={() => {
            if (workOrder?.status === WorkOrderStatus.SECOND_SCAN_COMPLETED) {
              handleSubmitFinal();
            } else if (workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS) {
              navigate(`/inventory/perform/${selectedWOId}`);
            } else {
              handleStartSecondScan();
            }
          }}
        >
          📡 {getSecondScanButtonText()}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 2 }}>

        {/* MATCHED */}
        <Box
          onClick={() => toggleFilter(ASSET_SCAN_STATUS.MATCHED)}
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            backgroundColor: statusFilter === ASSET_SCAN_STATUS.MATCHED ? "#e8f5e9" : "#fff",
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

                  {/* ASSET CODE */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <TagIcon fontSize="small" color="action" />
                    <Typography fontWeight="bold" fontSize={16}>
                      {asset.assetCode || "NEW ASSET"}
                    </Typography>
                  </Box>
  
                  {/* DESCRIPTION */}
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    <DescriptionIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {(asset.assetCode) ? asset.description : asset.rfidCode}
                    </Typography>
                  </Box>
  
                  {/* ZONE */}
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {asset.zoneCode !== asset.currentZoneCode && asset.scanStatus !== ASSET_SCAN_STATUS.MATCHED && ('Original Zone: ')}{asset.zoneCode}
                    </Typography>
                  </Box>

                  {asset.zoneCode !== asset.currentZoneCode && asset.scanStatus !== ASSET_SCAN_STATUS.MATCHED && (
                    <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="error" />
                      <Typography variant="caption" color="error" fontWeight="bold">
                        Current Zone: {asset.currentZoneCode}
                      </Typography>
                    </Box>
                  )}

                  {/* ===== 1st SCAN MODE ===== */}
                  {!isSecondScan &&
                    (asset.scanStatus === ASSET_SCAN_STATUS.NEW ||
                      asset.scanStatus === ASSET_SCAN_STATUS.MISSING) && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ mt: 1, alignSelf: "start" }}
                        onClick={() => handleMarkAsMatched(asset)}
                      >
                        ⬅️ Returned
                      </Button>
                  )}


                  {/* ===== 2nd SCAN MODE ===== */}
                  {isSecondScan && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        Remark:
                      </Typography>
                      <TextField
                        onChange={(e) => handleRemarkChange(asset.assetCode, e.target.value)}
                        value={remarks[asset.assetCode] || ""}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  )}

                  <Chip
                    icon={getStatusMeta(asset.scanStatus).icon}
                    label={getStatusMeta(asset.scanStatus).label}
                    size="small"
                    sx={{
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