import api from "./axios";

export const fetchAssetImage = async (documentCode) => {
  if (!documentCode) return null;

  const res = await api.get(
    `/asset/profile-picture?documentCode=${encodeURIComponent(documentCode)}`
  );

  return res.data?.data || null;
};

export const fetchAssetsByZone = async (zone) => {
  const res = await api.get(`/asset/zone/${zone}`);
  return res.data?.data || [];
};

export const mapAssets = (data, zone) => {
  return data.map((a) => ({
    id: `${a.assetCode}-${zone}`,
    assetCode: a.assetCode,
    assetDesc: a.description,
    zone: a.zone,
    organization: a.organizationDescription,
    location: a.location,
    department: a.department,
    commissionDate: a.commissionDate,
    condition: a.status,
    profilePicture: a.profilePicture || null,
    rfidCode: a.rfidCode,
    status: "MISSING" // default before scan
  }));
};