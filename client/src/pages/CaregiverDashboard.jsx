import DoseCard from "../components/DoseCard.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * CaregiverDashboard — read-only mirror of patient's view.
 * Sprint 0: identical layout, disabled controls, read-only badge.
 * No MedicationForm sidebar — caregivers cannot add meds.
 */
export default function CaregiverDashboard() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Top bar ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: "var(--color-primary)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={logo} alt="MedTrack" style={{ height: "36px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "0.25rem 0.75rem",
              borderRadius: "var(--radius)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            READ-ONLY
          </span>
          <Link
            to="/login"
            style={{ color: "#fff", textDecoration: "none", fontSize: "0.875rem" }}
          >
            Logout
          </Link>
        </div>
      </header>

      {/* ── Main body — full width, no sidebar ── */}
      <div
        style={{
          flex: 1,
          maxWidth: 800,
          margin: "0 auto",
          width: "100%",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Today section — read-only DoseCards */}
        <section>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Today</h2>
          {mockDoses.map((d, i) => (
            <DoseCard key={i} {...d} />
          ))}
        </section>

        {/* Adherence stats — same component, read-only data */}
        <section>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
            Adherence
          </h2>
          <AdherenceStat />
        </section>
      </div>
    </div>
  );
}

// Same placeholder doses as patient view
const mockDoses = [
  { medication: "Lisinopril", dosage: "10 mg", time: "08:00 AM" },
  { medication: "Metformin", dosage: "500 mg", time: "12:30 PM" },
  { medication: "Atorvastatin", dosage: "20 mg", time: "09:00 PM" },
];
