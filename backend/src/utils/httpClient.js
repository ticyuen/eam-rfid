import { ApiError } from "./apiError.js";

export async function safeRequest(promise) {
  try {
    const res = await promise;
    return res;
  } catch (err) {
    console.log("--- httpClient ---")
    console.log("error: ", err.response?.data)
    throw new ApiError(
      err.response?.status || 500,
      err.response?.data?.ErrorAlert?.[0]?.Message ||
      err.message ||
      "HxGN service error"
    );
  }
}