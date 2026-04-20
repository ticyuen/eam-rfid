import api from "./axios";

export const fetchWorkOrderScanUUID = async (workOrderId) => {
  const res = await api.get(
    `/work-order-scan/status?workOrderId=${workOrderId}`
  );

  return res.data?.data?.[0]?.uuid || null;
};

export const saveWorkOrderScanResult = async ({
  workOrderScanUUID,
  zone,
  locationId,
  assets
}) => {
  const res = await api.post(
    `/work-order-scan/${workOrderScanUUID}/zone/${zone}/save-result?locationId=${locationId}`,
    { assets }
  );

  return res.data;
};

export const fetchWorkOrderScanAssets = async ({ workOrderId, scanSeq }) => {
  const res = await api.get(
    `/work-order-scan/assets?workOrderId=${workOrderId}&scanSeq=${scanSeq}`
  );

  return res.data?.data || [];
};