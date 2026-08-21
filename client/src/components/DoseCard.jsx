import { Clock, Check, X, AlarmClock, CheckCircle2, XCircle } from "lucide-react";
import computeUrgency, { computeLatenessMinutes } from "../utils/urgency.js";
import MiniAdherenceRing from "./MiniAdherenceRing.jsx";

const statusIcons = {
  taken: <Check size={14} />,
  skipped: <X size={14} />,
  snoozed: <AlarmClock size={14} />,
};

function daysActiveLabel(start_date, end_date) {
  if (!start_date) return null;
  const start = new Date(start_date + "T00:00:00");
  const end = end_date ? new Date(end_date + "T00:00:00") : new Date();
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "0 days";
  return diff === 1 ? "1 day" : `${diff} days`;
}

export default function DoseCard({
  schedule_id,
  medication_name,
  dosage,
  time_of_day,
  status,
  logged_at,
  onLog,
  readOnly,
  now,
  adherence,
  scheduled_date,
  urgency: urgencyProp,
  start_date,
  end_date,
  pendingLog,
}) {
  const urgency = urgencyProp ?? computeUrgency(time_of_day, status, now, scheduled_date);
  const isNotYet = !status && urgency === "not-yet";
  const isDueSoon = !status && urgency === "due-soon";
  const isLocked = isNotYet || isDueSoon;
  const latenessMin = status ? computeLatenessMinutes(time_of_day, logged_at, scheduled_date) : 0;
  const isLate = latenessMin > 30;
  const daysLabel = daysActiveLabel(start_date, end_date);
  const ringValue = adherence;

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
      <div className="dose-card__top">
        <div className="dose-card__info">
          <div className="dose-card__name">{medication_name}</div>
          <div className="dose-card__dosage">{dosage}</div>
        </div>

        <div className="dose-card__meta">
          <span
            className={`dose-card__time ${
              urgency === "overdue" && !status ? "dose-card__time--overdue" : ""
            }`}
          >
            <Clock size={13} className="dose-card__time-icon" />
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

      {ringValue != null && (
        <div className="dose-card__ring-container">
          <MiniAdherenceRing value={ringValue} label={daysLabel} />
        </div>
      )}

      {!readOnly && !status && (
        <div className="dose-card__actions">
          {isLocked ? (
            <div className="dose-card__locked">
              <Clock size={13} />
              Available at {time_of_day}
            </div>
          ) : (
            <>
              <button
                className="dose-btn dose-btn--taken"
                disabled={!!pendingLog}
                onClick={() => onLog(schedule_id, "taken")}
              >
                <CheckCircle2 size={15} /> {pendingLog === "taken" ? "Saving…" : "Taken"}
              </button>
              <button
                className="dose-btn dose-btn--snooze"
                disabled={!!pendingLog}
                onClick={() => onLog(schedule_id, "snoozed")}
              >
                <AlarmClock size={15} /> {pendingLog === "snoozed" ? "Saving…" : "Snooze"}
              </button>
              <button
                className="dose-btn dose-btn--skip"
                disabled={!!pendingLog}
                onClick={() => onLog(schedule_id, "skipped")}
              >
                <XCircle size={15} /> {pendingLog === "skipped" ? "Saving…" : "Skip"}
              </button>
            </>
          )}
        </div>
      )}

      {status && (
        <div className="dose-card__status-row">
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
        </div>
      )}
    </div>
  );
}
