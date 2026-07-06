"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to dashboard
        router.push("/doctor/dashboard");
      } else {
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: "480px", marginTop: "4rem" }}>
      <div className="glass-container" style={{ padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Doctor Portal</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Secure physician login to manage consultations and schedules
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. doctor@ambula.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group" style={{ marginBottom: "1.5rem" }}>
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "1rem" }}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-light)", paddingTop: "1.25rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Testing credentials:
            <br />
            <strong>doctor@ambula.com</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>

      <style jsx global>{`
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: var(--radius-sm);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
