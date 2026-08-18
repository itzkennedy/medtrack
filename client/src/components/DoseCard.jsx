import { Clock, Check, X, AlarmClock, CheckCircle2, XCircle, AlarmClockOff } from "lucide-react";
import computeUrgency, { computeLatenessMinutes } from "../utils/urgency.js";

const statusIcons = {
  taken: <Check size={14} />,
  skipped: <X size={14} />,
  snoozed: <AlarmClock size={14} />,
};

export default function DoseCard({ schedule_id, medication_name, dosage, time_of_day, status, logged_at, onLog, readOnly, now, urgency: urgencyProp }) {
  const urgency = urgencyProp ?? computeUrgency(time_of_day, status, now);
  const isNotYet = !status && urgency === "not-yet";
  const isDueSoon = !status && urgency === "due-soon";
  const isLocked = isNotYet || isDueSoon;
  const latenessMin = status ? computeLatenessMinutes(time_of_day, logged_at, now) : 0;
  const isLate = latenessMin > 30;

  const cardClass = [
    "dose-card",
    !status && urgency === "overdue" && "dose-card--overdue",
    isDueSoon && "dose-card--due-soon",
    isNotYet && "dose-card--not-yet",
    status === "taken" && "dose-card--taken",
    status === "skipped" && "dose-card--skipped",
    status === "snoozed" && "dose-card--snoozed",
    !status && !urgency && "dose-card--pending",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="dose-card__body">
        <div className="dose-card__left">
          <div className="dose-card__name">{medication_name}</div>
          <div className="dose-card__dosage">{dosage}</div>
          <div className="dose-card__meta">
            <span className={`dose-card__time ${urgency === "overdue" && !status ? "dose-card__time--overdue" : ""}`}>
              <Clock size={14} className="dose-card__time-icon" />
              {time_of_day}
            </span>
            {urgency === "overdue" && !status && (
              <span className="dose-card__urgency dose-card__urgency--overdue">
                <span className="dose-card__pulse" />
                Overdue
              </span>
            )}
            {isDueSoon && (
              <span className="dose-card__urgency dose-card__urgency--due-soon">
                Due soon
              </span>
            )}
            {isNotYet && (
              <span className="dose-card__urgency dose-card__urgency--not-yet">
                Available at {time_of_day}
              </span>
            )}
          </div>
        </div>

        <div className="dose-card__right">
          {readOnly ? (
            isLocked ? (
              <span className="dose-card__status dose-card__status--not-yet">
                Available at {time_of_day}
              </span>
            ) : (
              <span className="dose-card__status dose-card__status--pending">
                {status || "Pending"}
              </span>
            )
          ) : status ? (
            <span className={`dose-card__status dose-card__status--${status}`}>
              {statusIcons[status]}
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {isLate && (
                <span className="dose-card__late-badge">
                  {latenessMin >= 60
                    ? `${Math.floor(latenessMin / 60)}h ${latenessMin % 60}m late`
                    : `${latenessMin} min late`}
                </span>
              )}
            </span>
          ) : null}
        </div>
      </div>

      {!readOnly && !status && (
        <div className="dose-card__actions">
          {isLocked ? (
            <div className="dose-card__locked">
              <Clock size={14} />
              Available at {time_of_day}
            </div>
          ) : (
            <>
              <button className="dose-btn dose-btn--taken" onClick={() => onLog(schedule_id, "taken")}>
                <CheckCircle2 size={16} /> Taken
              </button>
              <button className="dose-btn dose-btn--snooze" onClick={() => onLog(schedule_id, "snoozed")}>
                <AlarmClock size={16} /> Snooze
              </button>
              <button className="dose-btn dose-btn--skip" onClick={() => onLog(schedule_id, "skipped")}>
                <XCircle size={16} /> Skip
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
