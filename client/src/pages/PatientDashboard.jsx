import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import MedicationForm from "../components/MedicationForm.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import logo from "../assets/logo.png";

function computeUrgency(timeOfDay, status) {
  if (status) return null;
  try {
    const match = timeOfDay.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[4];
    if (period) {
      if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    const diffMin = (scheduled - now) / 60000;
    if (diffMin < 0) return "overdue";
    if (diffMin <= 60) return "due-soon";
  } catch {}
  return null;
}

const statusColors = {
  taken: "var(--color-success)",
  skipped: "var(--color-danger)",
  snoozed: "var(--color-warning)",
};

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editingMed, setEditingMed] = useState(null);
  const [view, setView] = useState("today");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [caregivers, setCaregivers] = useState([]);

  const fetchDoses = useCallback(async () => {
    try {
      const data = await api.getTodayDoses();
      setDoses(data);
    } catch (err) {
      console.error("Failed to fetch doses:", err);
    }
  }, []);

  const fetchAdherence = useCallback(async () => {
    try {
      const data = await api.getAdherence();
      setAdherence(data);
    } catch (err) {
      console.error("Failed to fetch adherence:", err);
    }
  }, []);

  const fetchMedications = useCallback(async () => {
    try {
      const data = await api.getMedications();
      setMedications(data);
    } catch (err) {
      console.error("Failed to fetch medications:", err);
    }
  }, []);

  const fetchCaregivers = useCallback(async () => {
    try {
      const data = await api.getCaregiverAccess();
      setCaregivers(data);
    } catch (err) {
      console.error("Failed to fetch caregivers:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchDoses(), fetchAdherence(), fetchMedications(), fetchCaregivers()]);
  }, [fetchDoses, fetchAdherence, fetchMedications, fetchCaregivers]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getDoseHistory(30);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "history" && history.length === 0 && !historyLoading) {
      fetchHistory();
    }
  }, [view, history.length, historyLoading, fetchHistory]);

  const handleLogDose = async (scheduleId, status) => {
    await api.logDose(scheduleId, status);
    refresh();
  };

  const handleInvite = async () => {
    setInviteLoading(true);
    setInviteError("");
    try {
      const data = await api.generateInvite();
      setInviteCode(data.invite_code);
      fetchCaregivers();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Delete ${med.name}? This will also remove its schedule and dose history.`)) return;
    try {
      await api.deleteMedication(med.medication_id);
      if (editingMed?.medication_id === med.medication_id) setEditingMed(null);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevoke = async (cg) => {
    if (!window.confirm(`Revoke ${cg.full_name}'s access to your data?`)) return;
    try {
      await api.revokeCaregiverAccess(cg.link_id);
      fetchCaregivers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.5rem", background: "var(--color-primary)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={logo} alt="MedTrack" style={{ height: "36px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem" }}>{user?.full_name}</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#fff", textDecoration: "none", fontSize: "0.875rem", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", padding: "1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setView("today")}
              style={{ background: view === "today" ? "var(--color-primary)" : "var(--color-surface)", color: view === "today" ? "#fff" : "var(--color-text)", border: "1px solid var(--color-border)", fontWeight: 500, fontSize: "0.875rem" }}
            >
              Today
            </button>
            <button
              onClick={() => setView("history")}
              style={{ background: view === "history" ? "var(--color-primary)" : "var(--color-surface)", color: view === "history" ? "#fff" : "var(--color-text)", border: "1px solid var(--color-border)", fontWeight: 500, fontSize: "0.875rem" }}
            >
              History
            </button>
          </div>

          {view === "today" && (
            <>
              <section>
                <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Today</h2>
                {doses.length === 0 ? (
                  <p style={{ color: "var(--color-muted)" }}>No scheduled doses for today.</p>
                ) : (
                  doses.map((d) => (
                    <DoseCard key={d.schedule_id} {...d} onLog={handleLogDose} urgency={computeUrgency(d.time_of_day, d.status)} />
                  ))
                )}
              </section>
              <section>
                <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Adherence</h2>
                <AdherenceStat stats={adherence} />
              </section>
            </>
          )}

          {view === "history" && (
            <section>
              <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Dose History (Last 30 Days)</h2>
              {historyLoading ? (
                <p style={{ color: "var(--color-muted)" }}>Loading...</p>
              ) : history.length === 0 ? (
                <p style={{ color: "var(--color-muted)" }}>No logged doses yet.</p>
              ) : (
                (() => {
                  const grouped = {};
                  for (const entry of history) {
                    if (!grouped[entry.date]) grouped[entry.date] = [];
                    grouped[entry.date].push(entry);
                  }
                  return Object.entries(grouped).map(([date, entries]) => (
                    <div key={date} style={{ marginBottom: "1rem" }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-muted)", marginBottom: "0.4rem" }}>
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {entries.map((e) => (
                        <div key={e.log_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.6rem 1rem", marginBottom: "0.35rem" }}>
                          <div>
                            <strong>{e.medication_name}</strong>
                            <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem" }}>{e.dosage}</span>
                            <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>scheduled {e.scheduled_time}</span>
                          </div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: statusColors[e.status] || "var(--color-muted)", textTransform: "capitalize" }}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ));
                })()
              )}
            </section>
          )}

          {medications.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>My Medications</h2>
              {medications.map((med) => (
                <div key={med.medication_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                  <div>
                    <strong>{med.name}</strong>
                    <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem" }}>{med.dosage}</span>
                    {med.schedules[0] && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        {med.schedules[0].time_of_day} · {med.schedules[0].days_of_week}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setEditingMed(med)}
                      style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(med)}
                      style={{ background: "none", border: "none", color: "var(--color-danger)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div>
            <button
              onClick={handleInvite}
              disabled={inviteLoading}
              style={{ alignSelf: "flex-start", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-primary)", fontWeight: 500, cursor: "pointer" }}
            >
              {inviteLoading ? "Generating..." : "Invite Caregiver"}
            </button>
            {inviteError && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginTop: "0.5rem" }}>{inviteError}</p>
            )}
            {inviteCode && (
              <div style={{ marginTop: "0.75rem", padding: "1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: "0.5rem" }}>Share this code with your caregiver:</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.15em", fontFamily: "monospace" }}>{inviteCode}</p>
              </div>
            )}
            {caregivers.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-muted)", marginBottom: "0.4rem" }}>Linked Caregivers</p>
                {caregivers.map((cg) => (
                  <div key={cg.link_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.5rem 0.75rem", marginBottom: "0.35rem" }}>
                    <div>
                      <span style={{ fontSize: "0.875rem" }}>{cg.full_name}</span>
                      {cg.email && <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginLeft: "0.4rem" }}>{cg.email}</span>}
                      {cg.status === "pending" && (
                        <span style={{ fontSize: "0.7rem", color: "var(--color-warning)", marginLeft: "0.4rem" }}>pending</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevoke(cg)}
                      style={{ background: "none", border: "none", color: "var(--color-danger)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside><MedicationForm onAdded={refresh} editing={editingMed} onDone={() => setEditingMed(null)} /></aside>
      </div>
    </div>
  );
}
