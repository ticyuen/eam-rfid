import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";
import { buildUDSRequest, UDSField } from "../lib/userDefinedScreenBuilder.js";
import { chunkArray, sleep } from "../utils/batch.util.js";
import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js";

const CHUNK_SIZE = 10;
const BATCH_DELAY = 200;    // optional safety delay (ms)

/**
 * Normalize + validate single scan
 */
function buildPayload(scan) {
  const {
    workOrderScanUuid,
    locationId,
    zoneCode,
    assetCode,
    assetStatus,
    scanSeq,
    remark
  } = scan;

  if (!zoneCode || !assetCode) {
    throw new Error(`Invalid scan payload for assetCode=${assetCode}, zoneCode=${zoneCode}`);
  }

  return buildUDSRequest({
    screenName: "UUASSC",
    action: "ADD",
    fields: [
      UDSField.uuid("UUID"),
      UDSField.text("WORKORDERSCANUUID", workOrderScanUuid),
      UDSField.text("LOCATIONID", locationId),
      UDSField.text("ZONECODE", zoneCode),
      UDSField.text("ASSETCODE", assetCode),
      UDSField.text("ASSETSTATUS", assetStatus || ""),
      UDSField.text("REASON", remark),
      UDSField.number("SCANSEQ", scanSeq ?? 0)
    ]
  });
}

export async function saveWorkOrderScanResultService(scans, context) {
  const chunks = chunkArray(scans, CHUNK_SIZE);

  const finalResults = [];

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (scan) => {
        const payload = buildPayload(scan);

        const res = await safeRequest(
          eamClient.post(
            "/userdefinedscreenservices",
            payload,
            eamRequest(context)
          )
        );

        return {
          assetCode: scan.assetCode,
          success: true,
          message:
            res.data?.Result?.InfoAlert?.Message || "Saved"
        };
      })
    );

    finalResults.push(...results);

    // 👇 small delay to avoid hammering HXGN
    await sleep(BATCH_DELAY);
  }

  return normalizeResults(finalResults, scans);
}

function normalizeResults(results, scans) {
  return {
    total: scans.length,
    success: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length,
    results: results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            assetCode: scans[i].assetCode,
            success: false,
            message: r.reason?.message || "Failed"
          }
    )
  };
}

export async function getWorkOrderScanStatusService({ workOrderId }, context) {
  const filters = [
    createFilter({
      alias: "WORKORDERID",
      value: workOrderId
    })
  ];

  const raw = await executeGrid({
    gridId: "100020",
    gridName: "0U5003",
    userFunctionName: "0U5003",
    filters
  }, context);

  const records = mapGridRecords(raw);

  return records.map(fields => ({
    uuid: fields.uuid,
    workOrderId: fields.workorderid,
    status: fields.workorderscanstatus
  }));
}

export async function getWorkOrderScanAssetsService(
  { workOrderId, scanSeq },
  context
) {
  const filters = [];

  if (workOrderId) {
    filters.push(createFilter({
      alias: "WO_CODE",
      value: workOrderId
    }));
  }

  if (scanSeq) {
    filters.push(createFilter({
      alias: "ASS_SCAN_SEQ",
      value: scanSeq
    }));
  }

  const raw = await executeGrid({
    gridId: "100024",
    gridName: "0U5005",
    userFunctionName: "0U5005",
    filters,
    rowLimit: 100
  }, context);

  const records = mapGridRecords(raw);

  return records.map(fields => ({
    assetCode: fields.ass_code,
    description: fields.ass_desc,
    organization: fields.ass_org,
    organizationCode: fields.ass_org_code,
    location: fields.ass_loc,
    department: fields.ass_dept,

    zone: fields.ass_zone,
    zoneCode: fields.ass_zone_code,
    currentZoneCode: fields.ass_c_zone_code,

    status: HXGN_STATUS[fields.ass_status],
    scanStatus: fields.ass_scan_status,
    scanSeq: Number(fields.ass_scan_seq),

    rfidCode: fields.ass_rfid_code,
    remark: fields.ass_reason,

    commissionDate: fields.ass_commiss,
    profilePicture: fields.ass_profile_pic,

    workOrderId: fields.wo_code,
    workOrderScanUuid: fields.wo_uuid
  }));
}