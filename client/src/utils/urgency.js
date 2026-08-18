export default function computeUrgency(timeOfDay, status) {
  if (status) return null;
  try {
    const match = timeOfDay.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[4];
    if (period) {
      if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    const diffMin = (scheduled - now) / 60000;
    if (diffMin < 0) return "overdue";
    if (diffMin <= 60) return "due-soon";
  } catch {}
  return null;
}
