import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js";

function transformAsset(data) {
  const asset = data?.Result?.ResultData?.AssetEquipment;

  if (!asset) return null;

  const customFields = asset?.USERDEFINEDAREA?.CUSTOMFIELD || [];

  const primarySystemField = customFields.find(
    (f) => f.PROPERTYCODE === "PS"
  );

  const primarySystem = primarySystemField
    ? primarySystemField.CLASSID?.DESCRIPTION
    : null;

  return {
    equipmentCode: asset.ASSETID?.EQUIPMENTCODE,
    organizationCode: asset.ASSETID?.ORGANIZATIONID?.ORGANIZATIONCODE,
    organizationDescription: asset.ASSETID?.ORGANIZATIONID?.DESCRIPTION,
    organizationEntity: asset.ASSETID?.ORGANIZATIONID?.entity,
    description: asset.ASSETID?.DESCRIPTION,
    classDescription: asset.CLASSID?.DESCRIPTION,

    primarySystem,

    status: asset.STATUS?.DESCRIPTION,
    department: asset.DEPARTMENTID?.DESCRIPTION,

    commissionDate: parseHxgnDate(asset.COMMISSIONDATE),
    originalInstallDate: parseHxgnDate(asset.ORIGINALINSTALLDATE),

    profilePicture: asset.PROFILEPICTURE?.DOCUMENTCODE,

    manufacturer: {
      code: asset.ManufacturerInfo?.MANUFACTURERCODE,
      serialNumber: asset.ManufacturerInfo?.SERIALNUMBER,
      model: asset.ManufacturerInfo?.MODEL
    }
  };
}

function parseHxgnDate(dateObj) {
  if (!dateObj) return null;

  // YEAR is epoch millis
  return new Date(dateObj.YEAR).toISOString();
}

export async function getAssetService({ assetCode, orgCode }, context) {
  const raw = `${assetCode}#${orgCode}`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const res = await safeRequest(
    eamClient.get(
      `/assets/${encodedId}`,
      eamRequest(context)
    )
  );

  return transformAsset(res.data);
}

function transformAssetList(rawData) {
  const records = rawData?.Result?.ResultData?.DATARECORD || [];

  return records.map((record) => {
    const fields = record.DATAFIELD.reduce((acc, field) => {
      acc[field.FIELDNAME] = field.FIELDVALUE;
      return acc;
    }, {});

    return {
      assetCode: fields.ass_code,
      description: fields.ass_desc,
      organization: fields.ass_org,
      organizationDescription: fields.org_desc,
      status: fields.ass_status,
      class: fields.cls_desc,
      primarySystem: fields.obj_primarysystem,
      commissionDate: fields.ass_commiss,
      document: fields.dae_document
    };
  });
}

export async function getAssetsByLocationService({ primarySystem }, context) {
  const payload = {
    GRID_TYPE: { TYPE: "LIST" },
    GRID: {
      CURRENT_TAB_NAME: "LST",
      GRID_ID: "100015",
      GRID_NAME: "0U5001",
      USER_FUNCTION_NAME: "0U5001",
      NUMBER_OF_ROWS_FIRST_RETURNED: 100
    },
    MULTIADDON_FILTERS: {
      MADDON_FILTER: [
        {
          ALIAS_NAME: "OBJ_PRIMARYSYSTEM",
          OPERATOR: "=",
          VALUE: primarySystem,
          JOINER: "AND",
          LPAREN: "",
          RPAREN: "",
          SEQNUM: 0
        }
      ]
    },
    REQUEST_TYPE: "LIST.HEAD_DATA.STORED"
  };

  const res = await safeRequest(
    eamClient.post("/grids", payload, eamRequest(context))
  );

  return transformAssetList(res.data);
}

export async function searchAssetsService(filtersInput, context) {
  const {
    zone,
    status,
    org,
    assetCode
  } = filtersInput;

  const filters = [];

  if (zone) {
    filters.push(createFilter({
      alias: "ass_zone",
      value: zone
    }));
  }

  if (status) {
    filters.push(createFilter({
      alias: "ass_condition",
      value: status
    }));
  }

  if (org) {
    filters.push(createFilter({
      alias: "ass_org_code",
      value: org
    }));
  }

  if (assetCode) {
    filters.push(createFilter({
      alias: "ASS_CODE",
      value: `${assetCode}`
    }));
  }

  const raw = await executeGrid({
    gridId: "100015",
    gridName: "0U5001",
    userFunctionName: "0U5001",
    filters
  }, context);

  const mapped = mapGridRecords(raw);

  return mapped.map(fields => ({
    assetCode: fields.ass_code,
    description: fields.ass_desc,
    organization: fields.ass_org_code,
    organizationDescription: fields.ass_org,
    location: fields.ass_loc,
    department: fields.ass_dept,
    status: HXGN_STATUS[fields.ass_condition] ?? fields.ass_condition,
    zone: fields.ass_zone,
    commissionDate: fields.ass_commiss,
    profilePicture: fields.ass_profile_pic,
    rfidCode: fields.ass_rfid_code
  }));
}