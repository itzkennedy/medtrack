const RING_SIZE = 38;
const STROKE = 3.5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_ARC = 0.09;

function ringColor(pct) {
  if (pct >= 80) return "var(--color-success)";
  if (pct >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

export default function MiniAdherenceRing({ value }) {
  if (value == null) return null;

  const visible = Math.max(value / 100, MIN_ARC);
  const offset = CIRCUMFERENCE - visible * CIRCUMFERENCE;
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
      </svg>
      <span className="mini-ring__value" style={{ color }}>{value}%</span>
    </div>
  );
}
