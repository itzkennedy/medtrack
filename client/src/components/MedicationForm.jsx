import { useState, useEffect, useCallback } from "react";
import { Pencil, Plus } from "lucide-react";
import * as api from "../api/client.js";

const DAY_OPTIONS = [
  { abbr: "MON", label: "Mon" },
  { abbr: "TUE", label: "Tue" },
  { abbr: "WED", label: "Wed" },
  { abbr: "THU", label: "Thu" },
  { abbr: "FRI", label: "Fri" },
  { abbr: "SAT", label: "Sat" },
  { abbr: "SUN", label: "Sun" },
];

const ALL_DAYS = DAY_OPTIONS.map((d) => d.abbr);
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];

function daysStringToArray(daysStr) {
  if (!daysStr || daysStr === "DAILY") return [...ALL_DAYS];
  if (daysStr === "WEEKDAYS") return [...WEEKDAYS];
  return daysStr.split(",").filter((d) => ALL_DAYS.includes(d));
}

function daysArrayToString(arr) {
  if (arr.length === 7) return "DAILY";
  if (arr.length === 5 && WEEKDAYS.every((d) => arr.includes(d))) return "WEEKDAYS";
  return arr.join(",");
}

function blankForm() {
  return {
    name: "",
    dosage: "",
    startDate: "",
    endDate: "",
    time: "",
    days: [...ALL_DAYS],
  };
}

export default function MedicationForm({ onAdded, editing, onDone }) {
  const [form, setForm] = useState(blankForm);
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
        days: daysStringToArray(schedule?.days_of_week || "DAILY"),
      });
    } else {
      setForm(blankForm());
    }
  }, [editing]);

  const toggleDay = useCallback((abbr) => {
    setForm((prev) => {
      const has = prev.days.includes(abbr);
      const next = has ? prev.days.filter((d) => d !== abbr) : [...prev.days, abbr];
      return { ...prev, days: next };
    });
  }, []);

  const setQuickSelect = useCallback((preset) => {
    setForm((prev) => ({ ...prev, days: [...preset] }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Medication name is required";
    if (!form.dosage.trim()) return "Dosage is required";
    if (!form.startDate) return "Start date is required";
    if (!form.time) return "Time of day is required";
    if (form.days.length === 0) return "Select at least one day";
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
        days_of_week: daysArrayToString(form.days),
      };
      if (editing) {
        await api.updateMedication(editing.medication_id, payload);
      } else {
        await api.addMedication(payload);
      }
      if (!editing) {
        setForm(blankForm());
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
        {editing ? <><Pencil size={16} /> Edit Medication</> : <><Plus size={16} /> Add Medication</>}
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
          <div className="day-picker">
            <div className="day-picker__quick-select">
              <button
                type="button"
                className={`day-quick-btn ${form.days.length === 7 ? "day-quick-btn--active" : ""}`}
                onClick={() => setQuickSelect(ALL_DAYS)}
              >
                Daily
              </button>
              <button
                type="button"
                className={`day-quick-btn ${form.days.length === 5 && WEEKDAYS.every((d) => form.days.includes(d)) ? "day-quick-btn--active" : ""}`}
                onClick={() => setQuickSelect(WEEKDAYS)}
              >
                Weekdays
              </button>
            </div>
            <div className="day-picker__grid">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.abbr}
                  type="button"
                  className={`day-toggle ${form.days.includes(day.abbr) ? "day-toggle--active" : ""}`}
                  onClick={() => toggleDay(day.abbr)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
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
