"use client";

import { FormEvent, useEffect, useState } from "react";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import { getSecuritySignals } from "@/lib/signals";
import type { Chain, ReportSummary, ScanReport } from "@/lib/types";

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
    </main>
  );
}

function RecentScans({ reports }: { reports: ReportSummary[] }) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <section className="recent-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Scan History</p>
          <h2>Recent scans</h2>
        </div>
        <span className="tag">Stored scan history</span>
      </div>

      <div className="recent-list">
        {reports.map((item) => (
          <a className="recent-item" href={`/report/${item.reportId}`} key={item.reportId}>
            <div>
              <strong>
                {item.tokenName ?? "Unknown Token"} {item.tokenSymbol ? `(${item.tokenSymbol})` : ""}
              </strong>
              <span>
                {chainLabels[item.chain]} · {shortAddress(item.address)} · {new Date(item.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="recent-meta">
              <span className={`mini-risk mini-risk-${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
              <span>{item.score}/100</span>
              <span>{formatUsd(item.liquidityUsd)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Report({ report }: { report: ScanReport }) {
  const [copied, setCopied] = useState(false);
  const riskClass = `risk-badge risk-${report.riskLevel.toLowerCase()}`;
  const sharePath = report.reportId ? `/report/${report.reportId}` : undefined;
  const shareUrl = typeof window !== "undefined" && sharePath ? `${window.location.origin}${sharePath}` : sharePath;

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="result-card">
      <div className="result-head">
        <div>
          <h2 className="token-title">
            {report.tokenName ?? "Unknown Token"} {report.tokenSymbol ? `(${report.tokenSymbol})` : ""}
          </h2>
          <p className="token-subtitle">
            {chainLabels[report.chain]} · {report.address}
          </p>
        </div>
        <div className={riskClass}>{report.riskLevel}</div>
      </div>

      {shareUrl ? (
        <div className={`share-box${copied ? " share-box-copied" : ""}`}>
          <div>
            <strong>Shareable report</strong>
            <span>{shareUrl}</span>
          </div>
          <button className={copied ? "copied" : ""} type="button" onClick={copyShareLink}>
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      ) : null}

      <div className="grid">
        <Metric label="Score" value={`${report.score}/100`} />
        <Metric label="Confidence" value={formatConfidence(report.confidence)} />
        <Metric label="Liquidity" value={formatUsd(report.market?.liquidityUsd)} />
        <Metric label="24h Volume" value={formatUsd(report.market?.volume24h)} />
        <Metric label="DEX" value={report.market?.dex ?? "Unknown"} />
      </div>

      <div className="signal-grid">
        {getSecuritySignals(report).map((signal) => (
          <Metric key={signal.label} label={signal.label} value={signal.value} />
        ))}
      </div>

      <p className="lead">{report.summary}</p>

      <ScoreBreakdown report={report} />

      <ul className="warning-list">
        {report.warnings.map((warning) => (
          <li className="warning" key={`${warning.severity}-${warning.title}`}>
            <strong>{warning.title}</strong>
            <p>{warning.explanation}</p>
            <p>{warning.recommendation}</p>
          </li>
        ))}
      </ul>

      <div className="grid">
        <Metric label="Data sources" value={report.dataSources.join(", ") || "None"} />
        <Metric label="Pair" value={report.market?.pairAddress ?? "Not found"} />
        <Metric label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
        <Metric label="Pair age" value={formatAge(report.market?.pairAgeHours)} />
      </div>
    </section>
  );
}

function ScoreBreakdown({ report }: { report: ScanReport }) {
  if (report.warnings.length === 0) return null;

  return (
    <div className="score-breakdown">
      <div className="breakdown-head">
        <strong>Score breakdown</strong>
        <span>{report.score}/100</span>
      </div>
      <div className="breakdown-list">
        {report.warnings.map((warning) => (
          <div className="breakdown-item" key={`${warning.severity}-${warning.title}`}>
            <span>{warning.title}</span>
            <strong>+{warningPoints(warning)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatConfidence(confidence: ScanReport["confidence"]) {
  if (confidence === "HIGH") return "High";
  if (confidence === "MEDIUM") return "Medium";
  return "Limited data";
}

function warningPoints(warning: ScanReport["warnings"][number]) {
  if (typeof warning.points === "number") return warning.points;
  if (warning.severity === "CRITICAL") return 70;
  if (warning.severity === "HIGH") return 45;
  if (warning.severity === "MEDIUM") return 25;
  return 10;
}

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function getDeviceId() {
  const storageKey = "risklens_device_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, deviceId);
  return deviceId;
}
