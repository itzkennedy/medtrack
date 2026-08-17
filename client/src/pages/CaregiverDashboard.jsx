import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
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

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("today");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      const data = await api.getLinkedPatients();
      setPatients(data);
      if (data.length === 1) {
        setSelectedPatient(data[0].user_id);
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      return [];
    }
  }, []);

  const fetchDoses = useCallback(async (patientId) => {
    try {
      setFetchError(null);
      const data = await api.getTodayDoses(patientId);
      setDoses(data);
    } catch (err) {
      if (err.message.includes("403") || err.message.includes("not linked")) {
        setFetchError("Access revoked. Please ask the patient for a new invite code.");
        setDoses([]);
        setAdherence(null);
        setPatients([]);
        setSelectedPatient(null);
      } else {
        console.error("Failed to fetch doses:", err);
      }
    }
  }, []);

  const fetchAdherence = useCallback(async (patientId) => {
    try {
      const data = await api.getAdherence(patientId);
      setAdherence(data);
    } catch (err) {
      console.error("Failed to fetch adherence:", err);
    }
  }, []);

  const fetchHistory = useCallback(async (patientId) => {
    setHistoryLoading(true);
    try {
      const data = await api.getDoseHistory(30, patientId);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients().then((data) => {
      if (data.length === 0) {
        setLoading(false);
      }
    });
  }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatient) return;
    setLoading(true);
    setHistory([]);
    setView("today");
    Promise.all([fetchDoses(selectedPatient), fetchAdherence(selectedPatient)]).then(() =>
      setLoading(false)
    );
  }, [selectedPatient, fetchDoses, fetchAdherence]);

  useEffect(() => {
    if (view === "history" && selectedPatient && history.length === 0 && !historyLoading) {
      fetchHistory(selectedPatient);
    }
  }, [view, selectedPatient, history.length, historyLoading, fetchHistory]);

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const data = await api.acceptInvite(inviteCode);
      setInviteSuccess(`Linked to ${data.full_name}!`);
      setInviteCode("");
      const updatedPatients = await fetchPatients();
      if (updatedPatients.length === 1) {
        setSelectedPatient(updatedPatients[0].user_id);
      }
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const selectedName = patients.find((p) => p.user_id === selectedPatient)?.full_name;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.5rem", background: "var(--color-primary)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={logo} alt="MedTrack" style={{ height: "36px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem" }}>{user?.full_name}</span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "0.25rem 0.75rem", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>
            READ-ONLY
          </span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#fff", textDecoration: "none", fontSize: "0.875rem", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {patients.length > 1 && (
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginRight: "0.5rem" }}>Viewing:</label>
            <select
              value={selectedPatient || ""}
              onChange={(e) => setSelectedPatient(parseInt(e.target.value))}
              style={{ padding: "0.4rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }}
            >
              {patients.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        )}

        {patients.length === 0 && !inviteSuccess && (
          <div style={{ padding: "1.5rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Link to a Patient</h2>
            <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Ask your patient for their invite code, then enter it below.
            </p>
            <form onSubmit={handleAcceptInvite} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={10}
                style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)", fontFamily: "monospace", fontSize: "1rem", letterSpacing: "0.1em" }}
              />
              <button type="submit" disabled={inviteLoading || !inviteCode.trim()} style={{ background: "var(--color-primary)", color: "#fff", padding: "0.5rem 1rem", borderRadius: "var(--radius)", border: "none", fontWeight: 500, cursor: "pointer" }}>
                {inviteLoading ? "Linking..." : "Link"}
              </button>
            </form>
            {inviteError && <p style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginTop: "0.5rem" }}>{inviteError}</p>}
          </div>
        )}

        {inviteSuccess && patients.length > 0 && (
          <p style={{ color: "var(--color-success)", fontSize: "0.875rem" }}>{inviteSuccess}</p>
        )}

        {fetchError && (
          <div style={{ padding: "1.5rem", background: "#fef2f2", border: "1px solid var(--color-danger)", borderRadius: "var(--radius)" }}>
            <p style={{ color: "var(--color-danger)", fontSize: "0.875rem" }}>{fetchError}</p>
          </div>
        )}

        {selectedPatient && (
          <>
            {selectedName && (
              <h2 style={{ fontSize: "1.125rem" }}>{selectedName}'s Doses</h2>
            )}

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
                  {loading ? (
                    <p style={{ color: "var(--color-muted)" }}>Loading...</p>
                  ) : doses.length === 0 ? (
                    <p style={{ color: "var(--color-muted)" }}>No scheduled doses for today.</p>
                  ) : (
                    doses.map((d) => (
                      <DoseCard key={d.schedule_id} {...d} readOnly urgency={computeUrgency(d.time_of_day, d.status)} />
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
          </>
        )}
      </div>
    </div>
  );
}
