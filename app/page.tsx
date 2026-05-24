"use client";

import { FormEvent, useEffect, useState } from "react";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import type { Chain, ReportSummary, ScanReport } from "@/lib/types";

export default function Home() {
  const [chain, setChain] = useState<Chain>("solana");
  const [address, setAddress] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadRecentReports();
  }, []);

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
    setLoading(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
        <span className="tag">Solana + EVM token risk scanner</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Scan before you trust</p>
          <h1>See token risk before you ape.</h1>
          <p className="lead">
            Paste a token address and RiskLens checks liquidity, token authorities, owner powers,
            honeypot signals, taxes, and holder concentration. Built for new Solana and EVM tokens.
          </p>

          <div className="stats">
            <div className="stat-card">
              <strong>3</strong>
              <span>MVP chains: Solana, Base, BNB</span>
            </div>
            <div className="stat-card">
              <strong>60s</strong>
              <span>Plain-language risk report</span>
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
          <p className="hint">
            MVP uses DexScreener, Solana RPC, and GoPlus where available. Results are automated warnings,
            not a full audit.
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
        <span className="tag">Cloud scan history</span>
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
  const riskClass = `risk-badge risk-${report.riskLevel.toLowerCase()}`;
  const sharePath = report.reportId ? `/report/${report.reportId}` : undefined;
  const shareUrl = typeof window !== "undefined" && sharePath ? `${window.location.origin}${sharePath}` : sharePath;

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
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
        <div className="share-box">
          <div>
            <strong>Shareable report</strong>
            <span>{shareUrl}</span>
          </div>
          <button type="button" onClick={copyShareLink}>
            Copy Link
          </button>
        </div>
      ) : null}

      <div className="grid">
        <Metric label="Score" value={`${report.score}/100`} />
        <Metric label="Liquidity" value={formatUsd(report.market?.liquidityUsd)} />
        <Metric label="24h Volume" value={formatUsd(report.market?.volume24h)} />
        <Metric label="DEX" value={report.market?.dex ?? "Unknown"} />
      </div>

      <p className="lead">{report.summary}</p>

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
