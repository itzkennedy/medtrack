/**
 * AdherenceStat — shows adherence % and streak.
 * Sprint 0: hardcoded placeholder values.
 */
export default function AdherenceStat() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Last 7 days
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          {mockStats.sevenDay}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Last 30 days
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          {mockStats.thirtyDay}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Current streak
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          {mockStats.streak} days
        </div>
      </div>
    </div>
  );
}

// Placeholder data — replaced by API in Sprint 2
const mockStats = { sevenDay: 85, thirtyDay: 78, streak: 5 };
