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
    <form className="med-form" onSubmit={handleSubmit}>
      <div className="med-form__title">
        {editing ? "\u270F Edit Medication" : "\u2795 Add Medication"}
      </div>

      {error && <div className="med-form__error">{error}</div>}

      <div className="med-form__fields">
        <div className="med-form__field">
          <label className="med-form__label">Name</label>
          <input name="name" placeholder="e.g. Ibuprofen" value={form.name} onChange={handleChange} required />
        </div>

        <div className="med-form__field">
          <label className="med-form__label">Dosage</label>
          <input name="dosage" placeholder="e.g. 200mg" value={form.dosage} onChange={handleChange} required />
        </div>

        <div className="med-form__field">
          <label className="med-form__label">Start date</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
        </div>

        <div className="med-form__field">
          <label className="med-form__label">End date (optional)</label>
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
        </div>

        <div className="med-form__field">
          <label className="med-form__label">Time of day</label>
          <input name="time" type="time" value={form.time} onChange={handleChange} required />
        </div>

        <div className="med-form__field">
          <label className="med-form__label">Days of week</label>
          <select name="days" value={form.days} onChange={handleChange}>
            <option value="DAILY">Daily</option>
            <option value="MON,WED,FRI">Mon / Wed / Fri</option>
            <option value="TUE,THU,SAT">Tue / Thu / Sat</option>
            <option value="WEEKDAYS">Weekdays</option>
          </select>
        </div>
      </div>

      <div className="med-form__actions">
        <button className="med-form__submit" type="submit" disabled={loading}>
          {loading ? "Saving..." : editing ? "Update" : "Add Medication"}
        </button>
        {editing && (
          <button className="med-form__cancel" type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
