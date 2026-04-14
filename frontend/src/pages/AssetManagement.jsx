import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { assetDetails } from "../mock/assetDetails.js";
import ExpandableTable from "../components/ExpandableTable";
import AssetDetailsModal from "../components/AssetDetailsModal.jsx";

export default function AssetManagement() {
  const [tableData, setTableData] = useState([]);
  const [descFilter, setDescFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Simulate API delay
    setTimeout(() => {
      setTableData(
        assetDetails.map((asset, index) => ({
          ...asset,
          id: asset.assetCode || index
        }))
      );
    }, 200);
  }, []);

  const descriptionOptions = [...new Set(tableData.map((a) => a.assetDesc))];
  const locationOptions = [...new Set(tableData.map((a) => a.location))];

  const columns = useMemo(() => [
    { field: "assetCode", headerName: "Asset Code" },
    { field: "assetDesc", headerName: "Description" },
    // { field: "location", headerName: "Location" },
  ], []);

  const filteredData = tableData.filter((asset) => {
    return (
      (descFilter === "All" || asset.assetDesc === descFilter) &&
      (locationFilter === "All" || asset.location === locationFilter)
    );
  });

  const handleInspectAsset = (asset) => {
    setSelectedAsset(asset);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAsset(null);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold">
        Assets
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mt: 3, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ width: "100%" }}>
          <InputLabel>Asset Type</InputLabel>
          <Select
            value={descFilter}
            label="Asset Type"
            onChange={(e) => setDescFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {descriptionOptions.map((desc) => (
              <MenuItem key={desc} value={desc}>
                {desc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: "100%", mt: 1 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={locationFilter}
            label="Location"
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {locationOptions.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ExpandableTable
        columns={columns}
        rows={filteredData}
        onInspect={handleInspectAsset}
      />

      <AssetDetailsModal
        open={modalOpen}
        asset={selectedAsset}
        onClose={handleCloseModal}
      />
    </Box>
  );
}