import { eamClient } from "../lib/axios.js";
import { demoClient } from "../lib/demoClient.js";
import { eamRequest } from "../lib/eamRequest.js";
import { safeRequest } from "../utils/httpClient.js";

/**
 * Build single filter
 */
export const createFilter = ({
  alias,
  operator = "=",
  value = "",
  joiner = "AND",
  lparen = "",
  rparen = "",
  seqNum = 0
}) => ({
  ALIAS_NAME: alias,
  OPERATOR: operator,
  VALUE: value,
  JOINER: joiner,
  LPAREN: lparen,
  RPAREN: rparen,
  SEQNUM: seqNum
});

/**
 * Build grid payload (GENERIC)
 */
export const buildGridPayload = ({
  gridId,
  gridName,
  userFunctionName,
  filters = [],
  gridType = "LIST",
  tabName = "LST",
  rowLimit = 100,
  cursorPosition
}) => ({
  GRID_TYPE: { TYPE: gridType },
  GRID: {
    CURRENT_TAB_NAME: tabName,
    GRID_ID: gridId,
    GRID_NAME: gridName,
    USER_FUNCTION_NAME: userFunctionName,
    NUMBER_OF_ROWS_FIRST_RETURNED: rowLimit,
    ...(cursorPosition && { CURRENT_CURSOR_POSITION: cursorPosition })
  },
  MULTIADDON_FILTERS: {
    MADDON_FILTER: filters.map((f, index) => ({
      ...f,
      SEQNUM: f.SEQNUM ?? index
    }))
  },
  REQUEST_TYPE: "LIST.HEAD_DATA.STORED"
});

/**
 * Generic grid executor
 */
export async function executeGrid({
  gridId,
  gridName,
  userFunctionName,
  filters = [],
  rowLimit,
  cursorPosition
}, context) {
  const payload = buildGridPayload({
    gridId,
    gridName,
    userFunctionName,
    filters,
    rowLimit,
    cursorPosition
  });

  const res = await safeRequest(
    demoClient.post("/grids", payload, eamRequest(context))
  );

  return res.data;
}

/**
 * Generic transformer (optional)
 */
export function mapGridRecords(rawData) {
  const records = rawData?.Result?.ResultData?.DATARECORD || [];

  return records.map((record) =>
    record.DATAFIELD.reduce((acc, field) => {
      acc[field.FIELDNAME] = field.FIELDVALUE;
      return acc;
    }, {})
  );
}

export async function getWorkOrdersService(params, context) {
  const { status = "R", fromDate, toDate } = params;

  const filters = [
    createFilter({ alias: "EVT_STATUS", value: status }),
    createFilter({ alias: "EVT_TARGET", operator: ">=", value: fromDate }),
    createFilter({ alias: "EVT_TARGET", operator: "<=", value: toDate })
  ];

  const raw = await executeGrid({
    gridId: "100737",
    gridName: "0U5001",
    userFunctionName: "0U5001",
    filters
  }, context);

  const mapped = mapGridRecords(raw);

  return mapped.map(fields => ({
    id: fields.evt_code,
    description: fields.evt_desc,
    location: fields.evt_udfchar05,
    asset: [],
    PM: fields.evt_ppm,
    status: fields.evt_udfchar04,
    scheduledStart: fields.evt_target,
    organization: fields.evt_org
  }));
}