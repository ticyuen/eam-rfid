import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

function extractBase64(data) {
  return data?.Result?.ResultData?.Document?.DocumentAttachment?.FILECONTENT;
}

export async function getDocumentService({ documentCode }, context) {
  // IMPORTANT: #* must be encoded → %23%2A
  const encoded = `${documentCode}%23%2A`;

  const res = await safeRequest(
    eamClient.get(
      `/documents/${encoded}`,
      eamRequest(context)
    )
  );

  const base64 = extractBase64(res.data);

  return base64;
}