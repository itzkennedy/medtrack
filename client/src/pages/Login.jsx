import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Login page — static shell for Sprint 0.
 * Form submission and JWT handling are Sprint 1.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Sprint 1: POST /api/auth/login
    alert("Login not implemented yet — Sprint 1");
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>MedTrack</h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        Sign in to your account
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Sign In
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
