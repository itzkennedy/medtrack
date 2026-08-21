import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import MedicationForm from "../components/MedicationForm.jsx";
import MedicationDetailModal from "../components/MedicationDetailModal.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import { computeLatenessMinutes } from "../utils/urgency.js";
import useReminders from "../utils/useReminders.js";
import useCurrentTime from "../utils/useCurrentTime.js";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PillBottle,
  Users,
  Copy,
  Check,
  X,
  AlarmClock,
  Bell,
  BellOff,
  ChevronRight,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../Dashboard.css";

function RingSpinner() {
  return (
    <span className="ring-spinner">
      <svg className="ring-spinner__svg" viewBox="0 0 36 36">
        <circle className="ring-spinner__track" cx="18" cy="18" r="14" />
        <circle className="ring-spinner__arc" cx="18" cy="18" r="14" />
      </svg>
    </span>
  );
}

function SkeletonCard() {
  return <div className="skeleton skeleton--card" />;
}

function SkeletonStreak() {
  return <div className="skeleton skeleton--streak" />;
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
  const [detailMed, setDetailMed] = useState(null);
  const [view, setView] = useState("today");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [logPending, setLogPending] = useState(null);
  const { permission, requestPermission, stopAlarm } = useReminders(doses);
  const now = useCurrentTime();

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
    if (logPending) return;
    setLogPending({ scheduleId, status });
    try {
      await api.logDose(scheduleId, status);
      stopAlarm();
      showToast(`Dose marked as ${status}`);
      await refresh();
    } catch (err) {
      showToast(err.message || "Failed to log dose", "error");
    } finally {
      setLogPending(null);
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      showToast("Code copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Failed to copy", "error");
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

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="dashboard-header__left">
            <img src={logo} alt="MedTrack" style={{ height: "32px" }} />
          </div>
          <div className="dashboard-header__right">
            <button className="dashboard-header__logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <div className="dashboard-body">
          <main className="dashboard-main">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonStreak />
            <SkeletonCard />
          </main>
          <aside className="dashboard-sidebar">
            <div className="med-form">
              <div className="skeleton" style={{ height: 20, width: 140, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 44, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 44, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 44, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 44 }} />
            </div>
          </aside>
      </div>

      {detailMed && (
        <MedicationDetailModal medication={detailMed} onClose={() => setDetailMed(null)} />
      )}
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
          {typeof Notification !== "undefined" && permission !== "granted" && (
            <div className="notification-bar">
              <div>
                <div className="notification-bar__label">
                  <Bell size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                  Enable dose reminders
                </div>
                <div className="notification-bar__info">
                  Reminders work while MedTrack is open in your browser. Closing the browser will stop them.
                </div>
              </div>
              <button
                className="notification-toggle"
                onClick={requestPermission}
                aria-label="Enable notifications"
              />
            </div>
          )}

          {fetchError && (
            <div className="error-banner">
              <AlertTriangle size={18} className="error-banner__icon" />
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
                <div className="today-date">{todayDateStr}</div>
                <div className="section-header">
                  <h2 className="section-header__title">Today&apos;s Doses</h2>
                  {doses.length > 0 && (
                    <span className="section-header__count">{doses.length}</span>
                  )}
                </div>
                {doses.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle2 size={40} className="empty-state__icon" style={{ color: "var(--color-success)" }} />
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
                      now={now}
                      pendingLog={logPending?.scheduleId === d.schedule_id ? logPending.status : null}
                    />
                  ))
                )}
              </section>

              <section style={{ textAlign: "center" }}>
                <div className="section-header" style={{ justifyContent: "center" }}>
                  <h2 className="section-header__title">Your Streak</h2>
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
                <div>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={40} className="empty-state__icon" style={{ color: "var(--color-muted)" }} />
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
                      {entries.map((e) => {
                        const lateness = computeLatenessMinutes(e.scheduled_time, e.logged_at);
                        const isLate = lateness > 30;
                        return (
                          <div key={e.log_id} className="history-entry">
                            <div className="history-entry__info">
                              <span className="history-entry__name">{e.medication_name}</span>
                              <span className="history-entry__dosage">{e.dosage}</span>
                              <span className="history-entry__time">at {e.scheduled_time}</span>
                            </div>
                            <span className={`dose-card__status dose-card__status--${e.status}`}>
                              {e.status === "taken" && <Check size={14} />}
                              {e.status === "skipped" && <X size={14} />}
                              {e.status === "snoozed" && <AlarmClock size={14} />}
                              {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                              {isLate && (
                                <span className="dose-card__late-badge">
                                  {lateness >= 60
                                    ? `${Math.floor(lateness / 60)}h ${lateness % 60}m late`
                                    : `${lateness} min late`}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
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
                <PillBottle size={40} className="empty-state__icon" style={{ color: "var(--color-primary)" }} />
                <div className="empty-state__title">No medications yet</div>
                <div className="empty-state__desc">
                  Use the form on the right to add your first medication.
                </div>
              </div>
            ) : (
              <div className="med-list">
                {medications.map((med) => (
                    <div key={med.medication_id} className="med-item">
                    <div className="med-item__info" onClick={() => setDetailMed(med)} style={{ cursor: "pointer" }}>
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
                    <ChevronRight size={16} className="med-item__chevron" />
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

          <section className="invite-section">
            <div className="invite-section__title">
              <Users size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Caregiver Access
            </div>
            <button className="invite-btn" onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <RingSpinner /> Generating...
                </span>
              ) : "Invite Caregiver"}
            </button>
            {inviteError && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{inviteError}</p>
            )}
            {inviteCode && (
              <div className="invite-code-box">
                <div className="invite-code-box__label">Share this code with your caregiver</div>
                <div className="invite-code-box__code">{inviteCode}</div>
                <button className="invite-code-copy" onClick={handleCopyCode} type="button">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy code"}
                </button>
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
          </section>
        </main>

        <aside className="dashboard-sidebar">
          <MedicationForm onAdded={refresh} editing={editingMed} onDone={() => setEditingMed(null)} />
        </aside>
      </div>

      {detailMed && (
        <MedicationDetailModal medication={detailMed} onClose={() => setDetailMed(null)} />
      )}
    </div>
  );
}
