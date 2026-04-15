import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js"
import { parseHxgnDateTime } from "../utils/date.util.js";

function transformWorkOrders(records) {
  const grouped = {};

  for (const fields of records) {
    const id = fields.wo_code;

    if (!grouped[id]) {
      grouped[id] = {
        id,
        description: fields.wo_desc,
        location: [],
        pm: fields.wo_pm_code,
        startDate: parseHxgnDateTime(fields.wo_start_date),
        endDate: parseHxgnDateTime(fields.wo_end_date),
        organization: fields.wo_org,
        objectOrganization: fields.wo_obj_org,
        status: HXGN_STATUS[fields.wo_status] || fields.wo_status
      };
    }

    // Push zone_id into location array (avoid duplicates)
    if (fields.wo_zone_id && !grouped[id].location.includes(fields.wo_zone_id)) {
      grouped[id].location.push(fields.wo_zone_id);
    }
  }

  return Object.values(grouped);
}

export async function getWorkOrdersService(filtersInput, context) {
  const {
    status,
    org,
    location,
    fromDate,
    toDate,
    workOrderCode
  } = filtersInput;

  const filters = [];

  if (workOrderCode) {
    filters.push(createFilter({
      alias: "WO_CODE",
      value: workOrderCode
    }));
  }

  if (org) {
    filters.push(createFilter({
      alias: "WO_ORG",
      value: org
    }));
  }

  if (location) {
    filters.push(createFilter({
      alias: "WO_LOCATION",
      value: location
    }));
  }

  if (fromDate) {
    filters.push(createFilter({
      alias: "WO_START_DATE",
      operator: ">=",
      value: fromDate
    }));
  }

  if (toDate) {
    filters.push(createFilter({
      alias: "WO_END_DATE",
      operator: "<=",
      value: toDate
    }));
  }

  const raw = await executeGrid({
    gridId: "100019",
    gridName: "0U5002",
    userFunctionName: "0U5002",
    filters,
    rowLimit: 100
  }, context);

  const mapped = mapGridRecords(raw);

  return transformWorkOrders(mapped);
}