import { Flame } from "lucide-react";

export default function AdherenceStat({ stats }) {
  const sevenDay = stats?.seven_day ?? 0;
  const thirtyDay = stats?.thirty_day ?? 0;
  const streak = stats?.streak ?? 0;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (sevenDay / 100) * circumference;

  const ringClass =
    sevenDay < 50
      ? "adherence-ring__fill adherence-ring__fill--low"
      : sevenDay < 80
        ? "adherence-ring__fill adherence-ring__fill--mid"
        : "adherence-ring__fill adherence-ring__fill--high";

  const streakRadius = 16;
  const streakCircumference = 2 * Math.PI * streakRadius;
  const streakOffset = streakCircumference - (Math.min(streak, 30) / 30) * streakCircumference;

  return (
    <div className="adherence-card">
      <div className="adherence-grid">
        <div className="adherence-ring">
          <svg className="adherence-ring__svg" viewBox="0 0 100 100">
            <circle className="adherence-ring__bg" cx="50" cy="50" r={radius} />
            <circle
              className={ringClass}
              cx="50"
              cy="50"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="adherence-ring__label">
            <span className="adherence-ring__value tabular-nums">{sevenDay}%</span>
            <span className="adherence-ring__text">7-day</span>
          </div>
        </div>

        <div className="adherence-stat">
          <span className="adherence-stat__value tabular-nums">{thirtyDay}%</span>
          <span className="adherence-stat__label">Last 30 days</span>
        </div>

        <div className="adherence-streak">
          <div className="adherence-streak__ring">
            <svg viewBox="0 0 36 36">
              <circle className="adherence-streak__ring-track" cx="18" cy="18" r={streakRadius} />
              <circle
                className="adherence-streak__ring-arc"
                cx="18"
                cy="18"
                r={streakRadius}
                strokeDasharray={streakCircumference}
                strokeDashoffset={streakOffset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            </svg>
          </div>
          <div className="adherence-streak__value tabular-nums">{streak}</div>
          <div className="adherence-streak__label">Day streak</div>
        </div>
      </div>
    </div>
  );
}
