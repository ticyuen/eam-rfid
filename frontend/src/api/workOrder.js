import api from "./axios";

export const mapWorkOrders = (data) => {
  return data.map((wo) => ({
    id: wo.id,
    description: wo.description,
    location: wo.location,
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