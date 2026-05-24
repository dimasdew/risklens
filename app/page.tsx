"use client";

import { FormEvent, useEffect, useState } from "react";
import { chainLabels } from "@/lib/chains";
import type { Chain, ReportSummary, ScanReport } from "@/lib/types";
import { PricingSection } from "./components/PricingSection";
import { RecentScans } from "./components/RecentScans";
import { Report } from "./components/Report";

const scanSteps = ["Reading market data", "Checking authorities", "Analyzing holders", "Calculating risk"];

export default function Home() {
  const [chain, setChain] = useState<Chain>("solana");
  const [address, setAddress] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    void loadRecentReports();
  }, []);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setScanStep((step) => Math.min(step + 1, scanSteps.length - 1));
    }, 900);

    return () => window.clearInterval(timer);
  }, [loading]);

  async function loadRecentReports() {
    const response = await fetch("/api/reports");
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

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json", "x-risklens-device-id": getDeviceId() },
        body: JSON.stringify({ chain, address })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Scan failed.");
      }

      setReport(payload);
      await loadRecentReports();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="logo">RL</span>
          <span>RiskLens</span>
        </div>
        <span className="tag">Solana and EVM token risk scanner</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Scan before you trust</p>
          <h1>Assess token risk before you trade.</h1>
          <p className="lead">
            Paste a token address and RiskLens checks liquidity, token authorities, owner powers,
            honeypot signals, taxes, and holder concentration. Built for new Solana and EVM tokens.
          </p>

          <div className="stats">
            <div className="stat-card">
              <strong>4</strong>
              <span>Supported chains: Solana, Base, BNB, Ethereum</span>
            </div>
            <div className="stat-card">
              <strong>50</strong>
              <span>Free scans per day</span>
            </div>
            <div className="stat-card">
              <strong>0</strong>
              <span>Wallet connection required</span>
            </div>
          </div>
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
            Free plan includes 50 scans per day. Results are automated risk signals and not financial advice.
          </p>
          {error ? <div className="error">{error}</div> : null}
        </form>
      </section>

      {report ? <Report report={report} /> : null}
      <RecentScans reports={recentReports} />
      <PricingSection />
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
