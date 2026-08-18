import { useEffect, useCallback } from "react";
import { X, Clock, Calendar, Pill } from "lucide-react";

const DAY_LABELS = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

function formatDays(daysStr) {
  if (!daysStr || daysStr === "DAILY") return "Every day";
  if (daysStr === "WEEKDAYS") return "Weekdays (Mon–Fri)";
  return daysStr
    .split(",")
    .map((d) => DAY_LABELS[d] || d)
    .join(", ");
}

export default function MedicationDetailModal({ medication, onClose }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!medication) return null;

  const schedule = medication.schedules?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            <Pill size={18} />
            {medication.name}
          </div>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__field">
            <span className="modal__label">Dosage</span>
            <span className="modal__value">{medication.dosage}</span>
          </div>

          <div className="modal__field">
            <span className="modal__label">Start date</span>
            <span className="modal__value">
              {medication.start_date?.slice(0, 10)}
              {medication.end_date && ` — ${medication.end_date.slice(0, 10)}`}
            </span>
          </div>

          {schedule && (
            <>
              <div className="modal__field">
                <span className="modal__label">
                  <Clock size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                  Time of day
                </span>
                <span className="modal__value">{schedule.time_of_day}</span>
              </div>

              <div className="modal__field">
                <span className="modal__label">
                  <Calendar size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                  Days of week
                </span>
                <span className="modal__value">{formatDays(schedule.days_of_week)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
