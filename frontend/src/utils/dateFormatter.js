export function formatScheduleDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const datePart = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const timePart = date.toTimeString().slice(0, 8); // HH:MM:SS

//   return `${datePart}\n${timePart}`;
  return {
    datePart,
    timePart
  }
}