function parseTimeOfDay(timeOfDay) {
  const match = timeOfDay.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[4];
  if (period) {
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

export default function computeUrgency(timeOfDay, status, now = new Date()) {
  if (status) return null;
  const parsed = parseTimeOfDay(timeOfDay);
  if (!parsed) return null;
  const scheduled = new Date(now);
  scheduled.setHours(parsed.hours, parsed.minutes, 0, 0);
  const diffMin = (scheduled - now) / 60000;
  if (diffMin < 0) return "overdue";
  if (diffMin <= 60) return "due-soon";
  return "not-yet";
}

export function computeLatenessMinutes(timeOfDay, loggedAt) {
  if (!loggedAt) return 0;
  const parsed = parseTimeOfDay(timeOfDay);
  if (!parsed) return 0;
  const logged = new Date(loggedAt);
  const scheduled = new Date(logged);
  scheduled.setHours(parsed.hours, parsed.minutes, 0, 0);
  const diffMin = Math.round((logged - scheduled) / 60000);
  return diffMin > 0 ? diffMin : 0;
}

export function formatScheduledTime(timeOfDay) {
  return timeOfDay;
}
