"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { chainLabels } from "@/lib/chains";
import type { Chain, ReportSummary, ScanReport } from "@/lib/types";
import { useAuth } from "../components/AuthProvider";
import { Navbar } from "../components/Navbar";
import { RecentScans } from "../components/RecentScans";
import { Report } from "../components/Report";
import { WaitlistModal } from "../components/WaitlistModal";
import { track } from "@/lib/analytics";

const scanSteps = ["Reading market data", "Checking authorities", "Analyzing holders", "Calculating risk"];

export default function ScanPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [chain, setChain] = useState<Chain>((searchParams.get("chain") as Chain) || "solana");
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanUsage, setScanUsage] = useState<{ used: number; limit: number; tier?: string } | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    void loadRecentReports();
    void loadScanUsage();
  }, []);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setScanStep((step) => Math.min(step + 1, scanSteps.length - 1));
    }, 900);

    return () => window.clearInterval(timer);
  }, [loading]);

  async function loadScanUsage() {
    try {
      const headers: Record<string, string> = { "x-risklens-device-id": getDeviceId() };

      if (user) {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
        const { data: session } = await getSupabaseBrowserClient().auth.getSession();
        if (session.session?.access_token) {
          headers.authorization = `Bearer ${session.session.access_token}`;
        }
      }

      const response = await fetch("/api/scan-usage", { headers });
      if (response.ok) {
        setScanUsage(await response.json());
      }
    } catch { /* ignore */ }
  }

  async function loadRecentReports() {
    const headers: Record<string, string> = {};

    if (user) {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
      const { data: session } = await getSupabaseBrowserClient().auth.getSession();
      if (session.session?.access_token) {
        headers.authorization = `Bearer ${session.session.access_token}`;
      }
    }

    const response = await fetch("/api/reports", { headers });
    if (!response.ok) return;

    const payload = (await response.json()) as { reports?: ReportSummary[] };
    setRecentReports(payload.reports ?? []);
  }

  async function scanToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReport(null);
    setScanStep(0);
    setLoading(true);
    track("scan_started", { chain, address });

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-risklens-device-id": getDeviceId()
      };

      if (user) {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
        const { data: session } = await getSupabaseBrowserClient().auth.getSession();
        if (session.session?.access_token) {
          headers.authorization = `Bearer ${session.session.access_token}`;
        }
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({ chain, address })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Scan failed.");
      }

      setReport(payload);
      track("scan_completed", { chain, address, score: payload.score, riskLevel: payload.riskLevel });
      await loadRecentReports();
      await loadScanUsage();
    } catch (scanError) {
      const msg = scanError instanceof Error ? scanError.message : "Scan failed.";
      track("scan_failed", { chain, address, error: msg });
      if (msg.includes("limit reached")) track("limit_hit", { chain });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell compact-shell">
      <Navbar />

      <section className="scan-hero">
        <div className="scan-hero-text">
          <p className="eyebrow">Token Scanner</p>
          <h1 className="scan-page-title">Scan any token in seconds.</h1>
          <p className="lead">
            Paste a contract address, choose a chain, and get a full risk report with clear warnings.
          </p>
        </div>

        <form className="scan-card" onSubmit={scanToken}>
          <div className="field">
            <label htmlFor="chain">Chain</label>
            <select id="chain" value={chain} onChange={(event) => setChain(event.target.value as Chain)}>
              {Object.entries(chainLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="address">Token address</label>
            <input
              id="address"
              maxLength={64}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={chain === "solana" ? "Solana mint address" : "0x..."}
            />
          </div>

          <button className="scan-button" disabled={loading || !address.trim()}>
            {loading ? "Scanning..." : "Scan Token"}
          </button>
          {loading ? (
            <div className="scan-progress">
              {scanSteps.map((step, index) => (
                <span className={index <= scanStep ? "active" : ""} key={step}>
                  {step}
                </span>
              ))}
            </div>
          ) : null}
          <p className="hint">
            {scanUsage && scanUsage.tier !== "free" ? (
              <span className="tier-badge tier-badge-pro">{scanUsage.tier === "admin" ? "Admin" : "Pro"} - Unlimited scans</span>
            ) : scanUsage ? (
              `${scanUsage.used}/${scanUsage.limit} scans used today. `
            ) : ""}
            Results are automated risk signals and not financial advice.
          </p>
          {scanUsage && scanUsage.tier === "free" && scanUsage.used >= 40 && (
            <div className="near-limit-cta">
              Running low on free scans.{" "}
              <button type="button" className="near-limit-link" onClick={() => setShowWaitlist(true)}>
                Join the Pro waitlist
              </button>{" "}
              for unlimited scans.
            </div>
          )}
          {error ? <div className="error">{error}</div> : null}
        </form>
      </section>

      {report ? <Report report={report} /> : null}
      <RecentScans reports={recentReports} personal={!!user} />
      {showWaitlist && <WaitlistModal plan="Pro" onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}

function getDeviceId() {
  const storageKey = "risklens_device_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, deviceId);
  return deviceId;
}
