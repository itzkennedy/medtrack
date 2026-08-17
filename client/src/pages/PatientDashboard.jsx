import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import MedicationForm from "../components/MedicationForm.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import logo from "../assets/logo.png";
import "../Dashboard.css";

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

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editingMed, setEditingMed] = useState(null);
  const [view, setView] = useState("today");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchDoses = useCallback(async () => {
    try {
      const data = await api.getTodayDoses();
      setDoses(data);
    } catch (err) {
      console.error("Failed to fetch doses:", err);
      setFetchError("Could not load your doses. Please try again.");
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
    setFetchError(null);
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
    try {
      await api.logDose(scheduleId, status);
      showToast(`Dose marked as ${status}`);
      await refresh();
    } catch (err) {
      showToast(err.message || "Failed to log dose", "error");
    }
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
      showToast(`${med.name} deleted`);
      refresh();
    } catch (err) {
      showToast(err.message || "Failed to delete medication", "error");
    }
  };

  const handleRevoke = async (cg) => {
    if (!window.confirm(`Revoke ${cg.full_name}'s access to your data?`)) return;
    try {
      await api.revokeCaregiverAccess(cg.link_id);
      showToast(`Access revoked for ${cg.full_name}`);
      fetchCaregivers();
    } catch (err) {
      showToast(err.message || "Failed to revoke access", "error");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <img src={logo} alt="MedTrack" style={{ height: "32px" }} />
        </div>
        <div className="dashboard-header__right">
          <span className="dashboard-header__name">{user?.full_name}</span>
          <button className="dashboard-header__logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <main className="dashboard-main">
          {fetchError && (
            <div className="error-banner">
              <span className="error-banner__icon">&#9888;</span>
              <span className="error-banner__text">{fetchError}</span>
              <button className="error-banner__retry" onClick={refresh}>Retry</button>
            </div>
          )}

          <div className="view-tabs">
            <button
              className={`view-tab ${view === "today" ? "view-tab--active" : ""}`}
              onClick={() => setView("today")}
            >
              Today
            </button>
            <button
              className={`view-tab ${view === "history" ? "view-tab--active" : ""}`}
              onClick={() => setView("history")}
            >
              History
            </button>
          </div>

          {view === "today" && (
            <>
              <section>
                <div className="section-header">
                  <h2 className="section-header__title">Today&apos;s Doses</h2>
                  {doses.length > 0 && (
                    <span className="section-header__count">{doses.length}</span>
                  )}
                </div>
                {doses.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">&#10003;</div>
                    <div className="empty-state__title">All caught up!</div>
                    <div className="empty-state__desc">
                      No scheduled doses for today. Add a medication to get started.
                    </div>
                  </div>
                ) : (
                  doses.map((d) => (
                    <DoseCard
                      key={d.schedule_id}
                      {...d}
                      onLog={handleLogDose}
                      urgency={computeUrgency(d.time_of_day, d.status)}
                    />
                  ))
                )}
              </section>

              <section>
                <div className="section-header">
                  <h2 className="section-header__title">Adherence</h2>
                </div>
                <AdherenceStat stats={adherence} />
              </section>
            </>
          )}

          {view === "history" && (
            <section>
              <div className="section-header">
                <h2 className="section-header__title">Dose History</h2>
                <span className="section-header__count">Last 30 days</span>
              </div>
              {historyLoading ? (
                <p style={{ color: "var(--color-muted)", padding: "1rem" }}>Loading...</p>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">&#128203;</div>
                  <div className="empty-state__title">No history yet</div>
                  <div className="empty-state__desc">
                    Logged doses will appear here as you track them.
                  </div>
                </div>
              ) : (
                (() => {
                  const grouped = {};
                  for (const entry of history) {
                    if (!grouped[entry.date]) grouped[entry.date] = [];
                    grouped[entry.date].push(entry);
                  }
                  return Object.entries(grouped).map(([date, entries]) => (
                    <div key={date} className="history-date-group">
                      <div className="history-date-label">
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {entries.map((e) => (
                        <div key={e.log_id} className="history-entry">
                          <div className="history-entry__info">
                            <span className="history-entry__name">{e.medication_name}</span>
                            <span className="history-entry__dosage">{e.dosage}</span>
                            <span className="history-entry__time">at {e.scheduled_time}</span>
                          </div>
                          <span className={`dose-card__status dose-card__status--${e.status}`}>
                            {e.status === "taken" && "\u2713 "}
                            {e.status === "skipped" && "\u2717 "}
                            {e.status === "snoozed" && "\u23F0 "}
                            {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ));
                })()
              )}
            </section>
          )}

          <section>
            <div className="section-header">
              <h2 className="section-header__title">My Medications</h2>
              {medications.length > 0 && (
                <span className="section-header__count">{medications.length}</span>
              )}
            </div>
            {medications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">&#128138;</div>
                <div className="empty-state__title">No medications yet</div>
                <div className="empty-state__desc">
                  Use the form on the right to add your first medication.
                </div>
              </div>
            ) : (
              <div className="med-list">
                {medications.map((med) => (
                  <div key={med.medication_id} className="med-item">
                    <div className="med-item__info">
                      <div>
                        <span className="med-item__name">{med.name}</span>
                        <span className="med-item__dosage">{med.dosage}</span>
                      </div>
                      {med.schedules?.[0] && (
                        <div className="med-item__schedule">
                          {med.schedules[0].time_of_day} &middot; {med.schedules[0].days_of_week}
                        </div>
                      )}
                    </div>
                    <div className="med-item__actions">
                      <button className="med-action med-action--edit" onClick={() => setEditingMed(med)}>
                        Edit
                      </button>
                      <button className="med-action med-action--delete" onClick={() => handleDelete(med)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="dashboard-sidebar">
          <MedicationForm onAdded={refresh} editing={editingMed} onDone={() => setEditingMed(null)} />

          <div className="invite-section">
            <div className="invite-section__title">Caregiver Access</div>
            <button className="invite-btn" onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "Generating..." : "Invite Caregiver"}
            </button>
            {inviteError && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{inviteError}</p>
            )}
            {inviteCode && (
              <div className="invite-code-box">
                <div className="invite-code-box__label">Share this code with your caregiver</div>
                <div className="invite-code-box__code">{inviteCode}</div>
              </div>
            )}
            {caregivers.length > 0 && (
              <div className="caregiver-list">
                <div className="caregiver-list__title">Linked Caregivers</div>
                {caregivers.map((cg) => (
                  <div key={cg.link_id} className="caregiver-item">
                    <div className="caregiver-item__info">
                      <span className="caregiver-item__name">{cg.full_name}</span>
                      {cg.email && <span className="caregiver-item__email">{cg.email}</span>}
                      {cg.status === "pending" && (
                        <span className="caregiver-item__badge">pending</span>
                      )}
                    </div>
                    <button className="caregiver-item__revoke" onClick={() => handleRevoke(cg)}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
