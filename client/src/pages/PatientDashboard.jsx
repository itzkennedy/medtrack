import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../api/client.js";
import DoseCard from "../components/DoseCard.jsx";
import MedicationForm from "../components/MedicationForm.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const refresh = useCallback(async () => {
    await Promise.all([fetchDoses(), fetchAdherence()]);
  }, [fetchDoses, fetchAdherence]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  const handleLogDose = async (scheduleId, status) => {
    await api.logDose(scheduleId, status);
    refresh();
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
        <h1 style={{ fontSize: "1.125rem" }}>MedTrack</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem" }}>{user?.full_name}</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#fff", textDecoration: "none", fontSize: "0.875rem", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", padding: "1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Today</h2>
            {doses.length === 0 ? (
              <p style={{ color: "var(--color-muted)" }}>No scheduled doses for today.</p>
            ) : (
              doses.map((d) => <DoseCard key={d.schedule_id} {...d} onLog={handleLogDose} />)
            )}
          </section>
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Adherence</h2>
            <AdherenceStat stats={adherence} />
          </section>
          <button style={{ alignSelf: "flex-start", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-primary)", fontWeight: 500 }} disabled title="Sprint 3">
            Invite Caregiver
          </button>
        </div>
        <aside><MedicationForm onAdded={refresh} /></aside>
      </div>
    </div>
  );
}
