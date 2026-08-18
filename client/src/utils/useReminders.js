import { useEffect, useRef, useCallback, useState } from "react";
import { unlockAudio, playAlarm, stopAlarm } from "./alarm.js";

function parseTimeToday(timeOfDay) {
  const match = timeOfDay.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[4];
  if (period) {
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  }
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  return target;
}

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.svg",
        tag: "medtrack-dose",
        requireInteraction: false,
      });
    } catch {
      if (self.registration) {
        self.registration.showNotification(title, { body, icon: "/favicon.svg" });
      }
    }
  }
}

export default function useReminders(doses) {
  const timersRef = useRef([]);
  const unlockedRef = useRef(false);
  const [permission, setPermission] = useState(() => {
    if (typeof Notification === "undefined") return "denied";
    return Notification.permission;
  });

  useEffect(() => {
    if (unlockedRef.current) return;
    const handler = () => {
      if (!unlockedRef.current) {
        unlockedRef.current = true;
        unlockAudio();
      }
    };
    document.addEventListener("click", handler, { once: true });
    document.addEventListener("keydown", handler, { once: true });
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  }, []);

  const scheduleTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (permission !== "granted") return;

    const now = new Date();
    for (const dose of doses) {
      if (dose.status) continue;
      const target = parseTimeToday(dose.time_of_day);
      if (!target) continue;
      const delay = target.getTime() - now.getTime();
      if (delay <= 0) continue;
      const timerId = setTimeout(() => {
        sendNotification(
          "Time to take your medication",
          `Take ${dose.medication_name} — ${dose.dosage}`
        );
        playAlarm();
      }, delay);
      timersRef.current.push(timerId);
    }
  }, [doses, permission]);

  useEffect(() => {
    scheduleTimers();
    return () => timersRef.current.forEach(clearTimeout);
  }, [scheduleTimers]);

  useEffect(() => {
    const onFocus = () => scheduleTimers();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) onFocus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [scheduleTimers]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied";
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted" && navigator.serviceWorker) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return result;
  }, []);

  return { permission, requestPermission, stopAlarm };
}
