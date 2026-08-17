export default function DoseCard({ schedule_id, medication_name, dosage, time_of_day, status, onLog, readOnly, urgency }) {
  const statusColors = {
    pending: "var(--color-border)",
    taken: "var(--color-success)",
    skipped: "var(--color-danger)",
    snoozed: "var(--color-warning)",
  };

  const urgencyStyles = {
    overdue: { background: "#fef2f2", borderLeft: "3px solid var(--color-danger)" },
    "due-soon": { background: "#fffbeb", borderLeft: "3px solid var(--color-warning)" },
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", marginBottom: "0.5rem", ...(urgencyStyles[urgency] || {}) }}>
      <div>
        <strong>{medication_name}</strong>
        <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem" }}>{dosage}</span>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{time_of_day}</div>
        {urgency === "overdue" && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", fontWeight: 600 }}>Overdue</span>
        )}
        {urgency === "due-soon" && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-warning)", fontWeight: 600 }}>Due soon</span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {readOnly ? (
          <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            {status || "Not yet logged"}
          </span>
        ) : status ? (
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: statusColors[status] || "var(--color-muted)", textTransform: "capitalize" }}>
            {status}
          </span>
        ) : (
          <>
            <button style={{ background: "var(--color-success)", color: "#fff" }} onClick={() => onLog(schedule_id, "taken")}>Taken</button>
            <button style={{ background: "var(--color-danger)", color: "#fff" }} onClick={() => onLog(schedule_id, "skipped")}>Skipped</button>
            <button style={{ background: "var(--color-warning)", color: "#fff" }} onClick={() => onLog(schedule_id, "snoozed")}>Snooze</button>
          </>
        )}
      </div>
    </div>
  );
}
