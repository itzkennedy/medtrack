import DoseCard from "../components/DoseCard.jsx";
import MedicationForm from "../components/MedicationForm.jsx";
import AdherenceStat from "../components/AdherenceStat.jsx";
import { Link } from "react-router-dom";

/**
 * PatientDashboard — main screen after login.
 * Sprint 0: static mock data, layout matching wireframe.
 * All data fetching lands in Sprint 2.
 */
export default function PatientDashboard() {
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
        <h1 style={{ fontSize: "1.125rem" }}>MedTrack</h1>
        <Link
          to="/login"
          style={{ color: "#fff", textDecoration: "none", fontSize: "0.875rem" }}
        >
          Logout
        </Link>
      </header>

      {/* ── Main body: dose list + sidebar ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "1.5rem",
          padding: "1.5rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Today section */}
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Today</h2>
            {mockDoses.map((d, i) => (
              <DoseCard key={i} {...d} />
            ))}
          </section>

          {/* Adherence stats */}
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
              Adherence
            </h2>
            <AdherenceStat />
          </section>

          {/* Invite caregiver */}
          <button
            style={{
              alignSelf: "flex-start",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-primary)",
              fontWeight: 500,
            }}
            disabled
            title="Sprint 3"
          >
            Invite Caregiver
          </button>
        </div>

        {/* Right sidebar — add medication form */}
        <aside>
          <MedicationForm />
        </aside>
      </div>
    </div>
  );
}

// Placeholder doses — replaced by API in Sprint 2
const mockDoses = [
  { medication: "Lisinopril", dosage: "10 mg", time: "08:00 AM" },
  { medication: "Metformin", dosage: "500 mg", time: "12:30 PM" },
  { medication: "Atorvastatin", dosage: "20 mg", time: "09:00 PM" },
];
