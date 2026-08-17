import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register({
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      navigate(data.user.role === "caregiver" ? "/caregiver" : "/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>MedTrack</h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>Create your account</p>
      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={handleChange} required minLength={8} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="patient">Patient</option>
          <option value="caregiver">Caregiver</option>
        </select>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff" }} disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
