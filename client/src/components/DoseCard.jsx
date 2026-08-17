export default function DoseCard({ schedule_id, medication_name, dosage, time_of_day, status, onLog, readOnly, urgency }) {
  const cardClass = [
    "dose-card",
    urgency === "overdue" && "dose-card--overdue",
    urgency === "due-soon" && "dose-card--due-soon",
    status && "dose-card--logged",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="dose-card__top">
        <div className="dose-card__info">
          <div className="dose-card__name">
            {medication_name}
            <span className="dose-card__dosage">{dosage}</span>
          </div>
          <div className="dose-card__time">
            <span className="dose-card__time-icon">&#128336;</span>
            {time_of_day}
          </div>
          {urgency === "overdue" && (
            <div className="dose-card__urgency dose-card__urgency--overdue">&#9888; Overdue</div>
          )}
          {urgency === "due-soon" && (
            <div className="dose-card__urgency dose-card__urgency--due-soon">&#9200; Due soon</div>
          )}
        </div>

        {readOnly ? (
          <span className="dose-card__status dose-card__status--pending">
            {status || "Not yet logged"}
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

      {!readOnly && !status && (
        <div className="dose-card__actions">
          <button className="dose-btn dose-btn--taken" onClick={() => onLog(schedule_id, "taken")}>
            &#10003; Taken
          </button>
          <button className="dose-btn dose-btn--snooze" onClick={() => onLog(schedule_id, "snoozed")}>
            &#9200; Snooze
          </button>
          <button className="dose-btn dose-btn--skipped" onClick={() => onLog(schedule_id, "skipped")}>
            &#10007; Skip
          </button>
        </div>
      )}
    </div>
  );
}
