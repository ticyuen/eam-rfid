import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { useNavigate } from "react-router-dom";
import { useWorkOrderStore } from "../store";
import { formatLocalDateTime } from "../utils/dateFormatter";
import { WorkOrderStatus } from "../constants";
import { createWorkOrderScan } from "../api/workOrder";
import { useState } from "react";
import { getDeviceName } from "../utils/device";

const WorkOrder = () => {
  const navigate = useNavigate();
  const { workOrders, updateStatus } = useWorkOrderStore();

  const [loadingId, setLoadingId] = useState(null);

  const handleAction = async (wo) => {
    switch (wo.status) {
      case WorkOrderStatus.RELEASED:
        try {
          setLoadingId(wo.id);

          const deviceName = getDeviceName();
          await createWorkOrderScan({
            workOrderId: wo.id,
            status: WorkOrderStatus.FIRST_SCAN_IN_PROGRESS,
            deviceName,
            deviceIp: null,
            remark: ""
          });

          updateStatus(wo.id, WorkOrderStatus.FIRST_SCAN_IN_PROGRESS);
          navigate(`/inventory/perform/${wo.id}`);

        } catch (err) {
          console.error(err);
        } finally {
          setLoadingId(null);
        }
        break;

      case WorkOrderStatus.FIRST_SCAN_IN_PROGRESS:
      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        navigate(`/inventory/perform/${wo.id}`);
        break;

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        navigate(`/inventory/summary/${wo.id}`);
        break;

      default:
        break;
    }
  };

  const getActionText = (status) => {
    switch (status) {
      case WorkOrderStatus.RELEASED:
        return "Start Work Order";

      case WorkOrderStatus.FIRST_SCAN_IN_PROGRESS:
        return "Continue 1st Scan";

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
        return "View Summary";

      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        return "Continue 2nd Scan";

      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        return "View Summary";

      case WorkOrderStatus.JOB_DONE:
        return "Completed";

      default:
        return "Open";
    }
  };

  const renderScanIcon = (done) =>
    done ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : (
      <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
    );

  const getScanStatus = (status) => {
    const firstScanDone =
      status === WorkOrderStatus.FIRST_SCAN_COMPLETED ||
      status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS ||
      status === WorkOrderStatus.SECOND_SCAN_COMPLETED ||
      status === WorkOrderStatus.JOB_DONE;

    const secondScanDone =
      status === WorkOrderStatus.SECOND_SCAN_COMPLETED ||
      status === WorkOrderStatus.JOB_DONE;

    return { firstScanDone, secondScanDone };
  };

  const getCardColor = (status) => {
    if (status === WorkOrderStatus.JOB_DONE) return "#d6fdd9";
    if (status === WorkOrderStatus.RELEASED) return "white";
    return "#fff8e1";
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Work Orders
      </Typography>

      <Stack spacing={2}>
        {workOrders.map((wo) => {
          const { firstScanDone, secondScanDone } = getScanStatus(wo.status);
          const formatted = formatLocalDateTime(wo.startDate);

          return (
            <Card
              key={wo.id}
              sx={{
                borderRadius: 2,
                backgroundColor: getCardColor(wo.status),
                boxShadow: 2
              }}
            >
              <CardContent>

                {/* HEADER */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    # {wo.id}
                  </Typography>

                  <Chip
                    label={wo.status}
                    size="small"
                    color={
                      wo.status === WorkOrderStatus.RELEASED
                        ? "inactive"
                        : "warning"
                    }
                  />
                </Box>

                {/* DATE */}
                <Typography variant="body2" sx={{ mt: 3 }}>
                  <strong>Start Date: </strong>
                  {formatted.date} • {formatted.time}
                </Typography>

                {/* PM */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>PM: </strong> {wo.PM || "-"}
                </Typography>

                {/* LOCATIONS */}
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>
                  Locations
                </Typography>

                {wo.location?.map((loc) => (
                  <Box
                    key={loc}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1
                    }}
                  >
                    <Typography variant="body2">{loc}</Typography>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {renderScanIcon(firstScanDone)}
                      {renderScanIcon(secondScanDone)}
                    </Box>
                  </Box>
                ))}

                <Divider sx={{ mt: 2 }} />

                {/* ACTION BUTTON */}
                {wo.status !== WorkOrderStatus.JOB_DONE && (
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => handleAction(wo)}
                    disabled={loadingId === wo.id}
                  >
                    {/* {getActionText(wo.status)} */}
                    {getActionText(wo.status)}{loadingId === wo.id ? "..." : ""}
                  </Button>
                )}

              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default WorkOrder;