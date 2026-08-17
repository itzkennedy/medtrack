import { useState } from "react";
import * as api from "../api/client.js";

export default function MedicationForm({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    startDate: "",
    endDate: "",
    time: "",
    days: "DAILY",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.addMedication({
        name: form.name,
        dosage: form.dosage,
        start_date: form.startDate,
        end_date: form.endDate || null,
        time_of_day: form.time,
        days_of_week: form.days,
      });
      setForm({ name: "", dosage: "", startDate: "", endDate: "", time: "", days: "DAILY" });
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ fontSize: "1rem" }}>Add Medication</h3>
      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.8rem" }}>{error}</p>
      )}
      <input name="name" placeholder="Medication name" value={form.name} onChange={handleChange} required />
      <input name="dosage" placeholder="Dosage (e.g. 500mg)" value={form.dosage} onChange={handleChange} required />
      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Start date</label>
      <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>End date (optional)</label>
      <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Time of day</label>
      <input name="time" type="time" value={form.time} onChange={handleChange} required />
      <label style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Days of week</label>
      <select name="days" value={form.days} onChange={handleChange}>
        <option value="DAILY">Daily</option>
        <option value="MON,WED,FRI">Mon / Wed / Fri</option>
        <option value="TUE,THU,SAT">Tue / Thu / Sat</option>
        <option value="WEEKDAYS">Weekdays</option>
      </select>
      <button type="submit" style={{ background: "var(--color-primary)", color: "#fff" }} disabled={loading}>
        {loading ? "Adding..." : "Add Medication"}
      </button>
    </form>
  );
}
