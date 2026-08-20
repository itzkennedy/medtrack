const RING_SIZE = 72;
const STROKE = 5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(pct) {
  if (pct >= 80) return "var(--color-success)";
  if (pct >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

export default function MiniAdherenceRing({ value, label }) {
  if (value == null) return null;

  const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;
  const color = ringColor(value);

  return (
    <div className="mini-ring">
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        {value > 0 && (
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.4s ease" }}
          />
        )}
      </svg>
      <span className="mini-ring__value" style={value > 0 ? { color } : undefined}>{value}%</span>
      {label && <span className="mini-ring__label">{label}</span>}
    </div>
  );
}
