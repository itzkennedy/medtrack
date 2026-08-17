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
            <span className="adherence-ring__value">{sevenDay}%</span>
            <span className="adherence-ring__text">7-day</span>
          </div>
        </div>

        <div className="adherence-stat">
          <span className="adherence-stat__value">{thirtyDay}%</span>
          <span className="adherence-stat__label">Last 30 days</span>
        </div>

        <div className="adherence-streak">
          <div className="adherence-streak__icon">&#128293;</div>
          <div className="adherence-streak__value">{streak}</div>
          <div className="adherence-streak__label">Day streak</div>
        </div>
      </div>
    </div>
  );
}
