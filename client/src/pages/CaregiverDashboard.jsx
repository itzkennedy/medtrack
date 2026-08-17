import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import logo from "../assets/logo.png";

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const data = await api.getTodayDoses(patientId);
      setDoses(data);
    } catch (err) {
      console.error("Failed to fetch doses:", err);
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
    Promise.all([fetchDoses(selectedPatient), fetchAdherence(selectedPatient)]).then(() =>
      setLoading(false)
    );
  }, [selectedPatient, fetchDoses, fetchAdherence]);

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

        {/* Patient selector — show if multiple patients */}
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

        {/* No linked patients — show invite code input */}
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

        {/* Invite success after linking */}
        {inviteSuccess && patients.length > 0 && (
          <p style={{ color: "var(--color-success)", fontSize: "0.875rem" }}>{inviteSuccess}</p>
        )}

        {/* Today section — read-only DoseCards */}
        {selectedPatient && (
          <>
            {selectedName && (
              <h2 style={{ fontSize: "1.125rem" }}>{selectedName}'s Doses</h2>
            )}
            <section>
              <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Today</h2>
              {loading ? (
                <p style={{ color: "var(--color-muted)" }}>Loading...</p>
              ) : doses.length === 0 ? (
                <p style={{ color: "var(--color-muted)" }}>No scheduled doses for today.</p>
              ) : (
                doses.map((d) => <DoseCard key={d.schedule_id} {...d} />)
              )}
            </section>

            <section>
              <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Adherence</h2>
              <AdherenceStat stats={adherence} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
