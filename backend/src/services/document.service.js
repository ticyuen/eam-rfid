import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

function extractBase64(data) {
  return data?.Result?.ResultData?.Document?.DocumentAttachment?.FILECONTENT;
}

export async function getDocumentService({ documentCode }, context) {
  const raw = `${documentCode}#*`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const res = await safeRequest(
    eamClient.get(
      `/documents/${encodedId}`,
      eamRequest(context)
    )
  );

  const base64 = extractBase64(res.data);

  return base64;
}