import { getDocumentService } from "../services/document.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfilePicture = asyncHandler(async (req, res) => {
  const { documentCode } = req.query;

  if (!documentCode) {
    throw new ApiError(400, "documentCode is required");
  }

  const base64 = await getDocumentService(
    { documentCode },
    req.context
  );

  res.json(new ApiResponse({ data: { base64 } }));
});