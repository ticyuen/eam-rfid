import api from "./axios";

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
    profilePicture: a.profilePicture,
    status: "MISSING" // default before scan
  }));
};