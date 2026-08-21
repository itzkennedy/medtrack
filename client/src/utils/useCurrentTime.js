import { useState, useEffect } from "react";

export const CLOCK_NUDGE_EVENT = "medtrack:clock-nudge";

export default function useCurrentTime(intervalMs = 20000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    const nudge = () => setNow(new Date());
    window.addEventListener(CLOCK_NUDGE_EVENT, nudge);
    return () => {
      clearInterval(id);
      window.removeEventListener(CLOCK_NUDGE_EVENT, nudge);
    };
  }, [intervalMs]);
  return now;
}
