import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js"
import { parseHxgnDateTime } from "../utils/date.util.js";
import { eamClient } from "../lib/axios.js";
import { eamRequest } from "../lib/eamRequest.js";
import { safeRequest } from "../utils/httpClient.js";
import { v4 as uuidv4 } from "uuid";
import { buildUDSRequest, UDSField } from "../lib/userDefinedScreenBuilder.js";
import { ENV } from "../config/env.js";

function transformWorkOrders(records) {
  const grouped = {};

  for (const fields of records) {
    const id = fields.wo_code;

    if (!grouped[id]) {
      grouped[id] = {
        id,
        description: fields.wo_desc,
        zone: [],
        pm: fields.wo_pm_code,
        startDate: parseHxgnDateTime(fields.wo_start_date),
        endDate: parseHxgnDateTime(fields.wo_end_date),
        organization: fields.wo_org,
        objectOrganization: fields.wo_obj_org,
        status: HXGN_STATUS[fields.wo_status] || fields.wo_status
      };
    }

    // Push zone_id into location array (avoid duplicates)
    if (fields.wo_zone_code && !grouped[id].zone.includes(fields.wo_zone_code)) {
      grouped[id].zone.push({
        id: fields.wo_zone_code,
        status: fields.wo_zone_status
      });
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

  if (status) {
    filters.push(createFilter({
      alias: "WO_STATUS",
      value: status
    }));
  }

  const raw = await executeGrid({
    gridId: ENV.GRID_WO_DETAILS_ID,
    gridName: ENV.GRID_WO_DETAILS_NAME,
    userFunctionName: ENV.GRID_WO_DETAILS_NAME,
    filters,
    rowLimit: 100
  }, context);

  const mapped = mapGridRecords(raw);

  return transformWorkOrders(mapped);
}

export async function addWorkOrderScanService(payload, context) {
  const {
    workOrderId,
    status,
    deviceName,
    deviceIp,
    remark
  } = payload;

  const requestBody = buildUDSRequest({
    screenName: "UUWOSC",
    action: "ADD",
    fields: [
      UDSField.uuid("UUID"),
      UDSField.text("WORKORDERID", String(workOrderId)),
      UDSField.text("WORKORDERSCANSTATUS", status),
      UDSField.text("DEVICENAME", deviceName || ""),
      UDSField.text("DEVICEIP", deviceIp || ""),
      UDSField.text("REMARK", remark || "")
    ]
  });

  const res = await safeRequest(
    eamClient.post(
      "/userdefinedscreenservices",
      requestBody,
      eamRequest(context)
    )
  );

  if (status?.toUpperCase() === "COMPLETED") {
    try {
      await updateWorkOrderStatusService(
        {
          workOrderId,
          orgCode: "TSUSHO1",
          status: "C"
        },
        context
      );
    } catch (err) {
      // Don't break main flow
      console.error("Failed to auto-complete work order:", err.message);
    }
  }

  return {
    success: true,
    message: res.data?.Result?.InfoAlert?.Message || "Scan saved",
    record: res.data?.Result?.ResultData?.UserDefinedScreenService
  };
}

export async function updateWorkOrderStatusService(
  { workOrderId, orgCode, status },
  context
) {
  if (!workOrderId || !orgCode || !status) {
    throw new Error("workOrderId, orgCode and status are required");
  }

  const raw = `${workOrderId}#${orgCode}`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const payload = {
    STATUS: {
      STATUSCODE: status
    }
  };

  const res = await safeRequest(
    eamClient.patch(
      `/workorders/${encodedId}`,
      payload,
      eamRequest(context)
    )
  );

  return {
    success: true,
    message:
      res.data?.Result?.InfoAlert?.Message ||
      "Work order updated",
    workOrderId: res.data?.Result?.ResultData?.JOBNUM
  };
}