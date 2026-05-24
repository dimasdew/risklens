"use client";

import { FormEvent, useState } from "react";
import { useToast } from "./Toast";

type WaitlistModalProps = {
  plan: string;
  onClose: () => void;
};

export function WaitlistModal({ plan, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, plan, useCase: useCase || undefined })
      });

      const payload = await response.json();

      if (!response.ok) {
        toast(payload.error ?? "Could not sign up.", "error");
        return;
      }

      toast("You're on the waitlist! We'll be in touch.", "success");
      onClose();
    } catch {
      toast("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <p className="eyebrow">Join the waitlist</p>
          <h2 className="auth-title">{plan === "pro" ? "RiskLens Pro" : "Community & API"}</h2>
          <p className="auth-subtitle">
            {plan === "pro"
              ? "Get early access to unlimited scans, watchlists, and alerts."
              : "Get early access to Telegram bots, batch scans, and API."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="wl-email">Email</label>
            <input
              id="wl-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="wl-usecase">What will you use it for? <span style={{ color: "var(--muted)" }}>(optional)</span></label>
            <input
              id="wl-usecase"
              type="text"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="e.g. monitor new launches, Telegram group"
            />
          </div>

          <button className="scan-button auth-submit" disabled={loading} type="submit">
            {loading ? "Joining..." : "Join waitlist"}
          </button>
        </form>

        <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
          &times;
        </button>
      </div>
    </div>
  );
}
