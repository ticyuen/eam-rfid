import { getDocumentService } from "../services/document.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const getProfilePicture = asyncHandler(async (req, res) => {
  const { documentCode } = req.query;

  if (!documentCode) {
    throw new ApiError(400, "documentCode is required");
  }

  const result = await getDocumentService(
    { documentCode },
    req.context
  );

  if (!result) {
    throw new ApiError(404, "Image not found");
  }

  res.json(new ApiResponse({
    data: {
      imageUrl: result.dataUrl,
      mimeType: result.mimeType
    }
  }));
});