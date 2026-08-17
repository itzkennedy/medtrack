/**
 * MedicationForm — "Add Medication" sidebar form.
 * Sprint 0: static shell. Submission is Sprint 1.
 */
export default function MedicationForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Sprint 1: POST /api/medications
    alert("Add medication not implemented yet — Sprint 1");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h3 style={{ fontSize: "1rem" }}>Add Medication</h3>

      <input name="name" placeholder="Medication name" required />
      <input name="dosage" placeholder="Dosage (e.g. 500mg)" required />

      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
        Start date
      </label>
      <input name="startDate" type="date" required />

      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
        End date (optional)
      </label>
      <input name="endDate" type="date" />

      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
        Time of day
      </label>
      <input name="time" type="time" required />

      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
        Days of week
      </label>
      <select name="days" defaultValue="DAILY">
        <option value="DAILY">Daily</option>
        <option value="MON,WED,FRI">Mon / Wed / Fri</option>
        <option value="TUE,THU,SAT">Tue / Thu / Sat</option>
        <option value="WEEKDAYS">Weekdays</option>
      </select>

      <button
        type="submit"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        Add Medication
      </button>
    </form>
  );
}
