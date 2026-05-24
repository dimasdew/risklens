"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Navbar } from "../components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="shell compact-shell">
        <Navbar />
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-header">
              <p className="eyebrow">Check your inbox</p>
              <h1 className="auth-title">Reset link sent</h1>
              <p className="auth-subtitle">
                We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.
              </p>
            </div>
            <Link href="/login" className="scan-button auth-submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Back to Log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell compact-shell">
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Forgot password</p>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">Enter your email and we&#39;ll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="scan-button auth-submit" disabled={loading} type="submit">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="auth-footer-text">
            Remember your password? <Link href="/login" className="auth-link">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
