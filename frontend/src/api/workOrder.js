import api from "./axios";

export const mapWorkOrders = (data) => {
  return data.map((wo) => ({
    id: Number(wo.id),
    description: wo.description,
    location: wo.location ? [wo.location] : [], // ensure array
    asset: wo.asset || [],
    PM: wo.PM || "",
    status: wo.status || "Released", // fallback
    scheduledStartDate: convertToISO(wo.scheduledStart),
    organization: wo.organization
  }));
};

// convert "05-MAR-2026" → ISO
const convertToISO = (dateStr) => {
  if (!dateStr) return null;

  const [day, mon, year] = dateStr.split("-");
  const months = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04",
    MAY: "05", JUN: "06", JUL: "07", AUG: "08",
    SEP: "09", OCT: "10", NOV: "11", DEC: "12"
  };

  return `${year}-${months[mon]}-${day}`;
};

export const fetchWorkOrders = async () => {
  const res = await api.post("/work-order", {
    status: "R",
    fromDate: "04-MAR-2026",
    toDate: "15-MAR-2026"
  });

  return res.data?.data || [];
};