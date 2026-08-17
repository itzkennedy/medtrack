/**
 * DoseCard — displays one scheduled medication dose.
 * Sprint 0: static placeholder. Buttons are non-functional.
 */
export default function DoseCard({ medication, dosage, time, status }) {
  const statusColors = {
    pending: "var(--color-border)",
    taken: "var(--color-success)",
    skipped: "var(--color-danger)",
    snoozed: "var(--color-warning)",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "1rem 1.25rem",
        marginBottom: "0.5rem",
      }}
    >
      <div>
        <strong>{medication}</strong>
        <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem" }}>
          {dosage}
        </span>
        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          {time}
        </div>
      </div>

      {/* Sprint 0: static buttons — wired to backend in Sprint 1 */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          style={{ background: "var(--color-success)", color: "#fff" }}
          disabled
          title="Sprint 1"
        >
          Taken
        </button>
        <button
          style={{ background: "var(--color-danger)", color: "#fff" }}
          disabled
          title="Sprint 1"
        >
          Skipped
        </button>
        <button
          style={{ background: "var(--color-warning)", color: "#fff" }}
          disabled
          title="Sprint 1"
        >
          Snooze
        </button>
      </div>
    </div>
  );
}
