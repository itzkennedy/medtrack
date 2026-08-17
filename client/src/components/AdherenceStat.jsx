export default function AdherenceStat({ stats }) {
  const sevenDay = stats?.seven_day ?? "--";
  const thirtyDay = stats?.thirty_day ?? "--";
  const streak = stats?.streak ?? "--";

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Last 7 days</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{sevenDay}%</div>
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Last 30 days</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{thirtyDay}%</div>
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Current streak</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{streak} days</div>
      </div>
    </div>
  );
}
