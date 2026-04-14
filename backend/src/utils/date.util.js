export function isExpired(dateStr) {
  if (!dateStr) return true;

  const parsed = new Date(dateStr); // works with "02-APR-2026"
  return parsed.getTime() < Date.now();
}