export default function DoseCard({ schedule_id, medication_name, dosage, time_of_day, status, onLog, readOnly, urgency }) {
  const cardClass = [
    "dose-card",
    !status && urgency === "overdue" && "dose-card--overdue",
    !status && urgency === "due-soon" && "dose-card--due-soon",
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
              <span className="dose-card__time-icon">&#128336;</span>
              {time_of_day}
            </span>
            {urgency === "overdue" && !status && (
              <span className="dose-card__urgency dose-card__urgency--overdue">
                <span className="dose-card__pulse" />
                Overdue
              </span>
            )}
            {urgency === "due-soon" && !status && (
              <span className="dose-card__urgency dose-card__urgency--due-soon">
                Due soon
              </span>
            )}
          </div>
        </div>

        <div className="dose-card__right">
          {readOnly ? (
            <span className="dose-card__status dose-card__status--pending">
              {status || "Pending"}
            </span>
          ) : status ? (
            <span className={`dose-card__status dose-card__status--${status}`}>
              {status === "taken" && "\u2713 "}
              {status === "skipped" && "\u2717 "}
              {status === "snoozed" && "\u23F0 "}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          ) : null}
        </div>
      </div>

      {!readOnly && !status && (
        <div className="dose-card__actions">
          <button className="dose-btn dose-btn--taken" onClick={() => onLog(schedule_id, "taken")}>
            &#10003; Taken
          </button>
          <button className="dose-btn dose-btn--snooze" onClick={() => onLog(schedule_id, "snoozed")}>
            &#9200; Snooze
          </button>
          <button className="dose-btn dose-btn--skip" onClick={() => onLog(schedule_id, "skipped")}>
            &#10007; Skip
          </button>
        </div>
      )}
    </div>
  );
}
