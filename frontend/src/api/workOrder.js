import { ZONE_STATUS } from "../constants/zoneStatus";
import api from "./axios";

export const mapWorkOrders = (data) => {
  return data.map((wo) => ({
    id: wo.id,
    description: wo.description,
    zone: wo.zone.map((z) => ({
      id: z.id,
      status: Number(z.status) || 0
    })),
    PM: wo.pm || "",
    startDate: wo.startDate,
    endDate: wo.endDate,
    organization: wo.organization,
    objOrganization: wo.objectOrganization,
    status: wo.status || "Released"
  }));
};

export const fetchWorkOrders = async () => {
  const res = await api.post("/work-order", {
    // fromDate: "10-APR-2026",
    // toDate: "30-MAY-2026"
  });

  return res.data?.data || [];
};

export const createWorkOrderScan = async ({
  workOrderId,
  status,
  deviceName,
  deviceIp,
  remark = ""
}) => {
  const res = await api.post("/work-order/scan", {
    workOrderId: String(workOrderId),
    status,
    deviceName,
    deviceIp,
    remark
  });

  return res.data;
};