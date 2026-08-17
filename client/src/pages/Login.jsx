import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user.role === "caregiver" ? "/caregiver" : "/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>MedTrack</h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Sign in to your account
      </p>
      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff" }} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
