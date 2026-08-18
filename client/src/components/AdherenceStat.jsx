import { Flame } from "lucide-react";

export default function AdherenceStat({ stats }) {
  const streak = stats?.streak ?? 0;

  const streakRadius = 20;
  const streakCircumference = 2 * Math.PI * streakRadius;
  const streakOffset = streakCircumference - (Math.min(streak, 30) / 30) * streakCircumference;

  return (
    <div className="adherence-card adherence-card--streak">
      <div className="adherence-streak">
        <div className="adherence-streak__ring">
          <svg viewBox="0 0 44 44">
            <circle className="adherence-streak__ring-track" cx="22" cy="22" r={streakRadius} />
            <circle
              className="adherence-streak__ring-arc"
              cx="22"
              cy="22"
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
  );
}
