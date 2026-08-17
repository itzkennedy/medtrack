import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Register page — static shell for Sprint 0.
 * Actual registration is Sprint 1.
 */
export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "patient",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Sprint 1: POST /api/auth/register
    alert("Registration not implemented yet — Sprint 1");
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>MedTrack</h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Create your account
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="patient">Patient</option>
          <option value="caregiver">Caregiver</option>
        </select>
        <button
          type="submit"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Create Account
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
