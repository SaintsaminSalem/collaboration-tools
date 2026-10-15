import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      onAuth(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Sign in</h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 14 }}>
          Welcome back to your workspace
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, color: "#666", textAlign: "center" }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "#f8fafc", fontFamily: "sans-serif",
};
const cardStyle = {
  width: 360, background: "#fff", padding: 32, borderRadius: 12,
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column",
};
const labelStyle = { fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#333" };
const inputStyle = {
  padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8,
  fontSize: 14, marginBottom: 14, outline: "none",
};
const btnStyle = {
  padding: "10px 14px", background: "#4f46e5", color: "#fff", border: "none",
  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4,
};
const errorStyle = {
  background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 8,
  fontSize: 13, marginBottom: 12,
};
