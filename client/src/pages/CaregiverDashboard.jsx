import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import { computeLatenessMinutes } from "../utils/urgency.js";
import useReminders from "../utils/useReminders.js";
import useCurrentTime from "../utils/useCurrentTime.js";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Check,
  X,
  AlarmClock,
  Bell,
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

function SkeletonAdherenceCard() {
  return (
    <div className="adherence-card skeleton--adherence-card">
      <div className="skeleton-grid">
        <div className="skeleton skeleton--ring" />
        <div>
          <div className="skeleton skeleton--stat" style={{ marginBottom: 6 }} />
          <div className="skeleton skeleton--line-sm" />
        </div>
        <div>
          <div className="skeleton skeleton--stat" style={{ marginBottom: 6 }} />
          <div className="skeleton skeleton--line-sm" />
        </div>
      </div>
    </div>
  );
}

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
  const { permission, requestPermission, stopAlarm } = useReminders(doses);
  const now = useCurrentTime();

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
        setFetchError("Could not load doses. Please try again.");
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

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const isLoadingDoses = loading && selectedPatient;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <img src={logo} alt="MedTrack" style={{ height: "32px" }} />
        </div>
        <div className="dashboard-header__right">
          <span className="dashboard-header__name">{user?.full_name}</span>
          <span style={{
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "0.25rem 0.75rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
          }}>
            READ-ONLY
          </span>
          <button className="dashboard-header__logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", padding: "var(--space-xl)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>

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

        {patients.length > 1 && (
          <div className="med-form__field" style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-sm)" }}>
            <label className="med-form__label" style={{ whiteSpace: "nowrap" }}>Viewing:</label>
            <select
              value={selectedPatient || ""}
              onChange={(e) => setSelectedPatient(parseInt(e.target.value))}
              style={{ flex: 1 }}
            >
              {patients.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        )}

        {patients.length === 0 && !inviteSuccess && (
          <div className="invite-section">
            <div className="invite-section__title">Link to a Patient</div>
            <p style={{ color: "var(--color-muted)", fontSize: "0.8125rem", marginBottom: "var(--space-md)" }}>
              Ask your patient for their invite code, then enter it below.
            </p>
            <form onSubmit={handleAcceptInvite} style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-start" }}>
              <input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={10}
                style={{ flex: 1, fontFamily: '"IBM Plex Mono", monospace', fontSize: "1rem", letterSpacing: "0.1em" }}
              />
              <button className="empty-state__action" type="submit" disabled={inviteLoading || !inviteCode.trim()}>
                {inviteLoading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <RingSpinner /> Linking...
                  </span>
                ) : "Link"}
              </button>
            </form>
            {inviteError && <p style={{ color: "var(--color-danger)", fontSize: "0.8125rem", marginTop: "var(--space-sm)" }}>{inviteError}</p>}
          </div>
        )}

        {inviteSuccess && patients.length > 0 && (
          <div style={{ padding: "var(--space-md) var(--space-lg)", background: "var(--color-success-light)", border: "1px solid #bbf7d0", borderRadius: "var(--radius)", color: "var(--color-success)", fontSize: "0.875rem", fontWeight: 500 }}>
            {inviteSuccess}
          </div>
        )}

        {fetchError && (
          <div className="error-banner">
            <AlertTriangle size={18} className="error-banner__icon" />
            <span className="error-banner__text">{fetchError}</span>
          </div>
        )}

        {selectedPatient && (
          <>
            {selectedName && (
              <div className="section-header">
                <h2 className="section-header__title">{selectedName}&apos;s Doses</h2>
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
                  </div>
                  {isLoadingDoses ? (
                    <div>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : doses.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle2 size={40} className="empty-state__icon" style={{ color: "var(--color-success)" }} />
                      <div className="empty-state__title">No doses scheduled</div>
                      <div className="empty-state__desc">This patient has no doses for today.</div>
                    </div>
                  ) : (
                    doses.map((d) => (
                      <DoseCard key={d.schedule_id} {...d} readOnly now={now} />
                    ))
                  )}
                </section>

                <section>
                  <div className="section-header">
                    <h2 className="section-header__title">Your Streak</h2>
                  </div>
                  {isLoadingDoses ? <SkeletonAdherenceCard /> : <AdherenceStat stats={adherence} />}
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
                    <div className="empty-state__desc">Logged doses will appear here.</div>
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
                          {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
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
          </>
        )}
      </div>
    </div>
  );
}
