import { useState, useEffect } from "react";
import * as api from "../api/client.js";

export default function MedicationForm({ onAdded, editing, onDone }) {
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

  useEffect(() => {
    if (editing) {
      const schedule = editing.schedules?.[0];
      const rawTime = schedule?.time_of_day || "";
      const time = rawTime.length === 8 ? rawTime.slice(0, 5) : rawTime;
      setForm({
        name: editing.name,
        dosage: editing.dosage,
        startDate: editing.start_date?.slice(0, 10) || "",
        endDate: editing.end_date?.slice(0, 10) || "",
        time,
        days: schedule?.days_of_week || "DAILY",
      });
    }
  }, [editing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name.trim()) return "Medication name is required";
    if (!form.dosage.trim()) return "Dosage is required";
    if (!form.startDate) return "Start date is required";
    if (!form.time) return "Time of day is required";
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      return "End date must be after start date";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        start_date: form.startDate,
        end_date: form.endDate || null,
        time_of_day: form.time,
        days_of_week: form.days,
      };
      if (editing) {
        await api.updateMedication(editing.medication_id, payload);
      } else {
        await api.addMedication(payload);
      }
      if (!editing) {
        setForm({ name: "", dosage: "", startDate: "", endDate: "", time: "", days: "DAILY" });
      }
      onAdded?.();
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ fontSize: "1rem" }}>{editing ? "Edit Medication" : "Add Medication"}</h3>
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
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", flex: 1 }} disabled={loading}>
          {loading ? "Saving..." : editing ? "Update Medication" : "Add Medication"}
        </button>
        {editing && (
          <button type="button" onClick={onDone} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
