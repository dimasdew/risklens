"use client";

import { useState } from "react";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import { getSecuritySignals } from "@/lib/signals";
import type { ScanReport } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { Metric } from "./Metric";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { useToast } from "./Toast";
import { track } from "@/lib/analytics";

export function Report({ report }: { report: ScanReport }) {
  const [copied, setCopied] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const riskClass = `risk-badge risk-${report.riskLevel.toLowerCase()}`;
  const sharePath = report.reportId ? `/report/${report.reportId}` : undefined;
  const shareUrl = typeof window !== "undefined" && sharePath ? `${window.location.origin}${sharePath}` : sharePath;

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Report link copied to clipboard.", "success");
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
          <li className={`warning warning-${warning.severity.toLowerCase()}`} key={`${warning.severity}-${warning.title}`}>
            <div className="warning-header">
              <span className={`warning-severity warning-severity-${warning.severity.toLowerCase()}`}>{warning.severity}</span>
              <strong>{warning.title}</strong>
            </div>
            <p>{warning.explanation}</p>
            <p className="warning-rec">{warning.recommendation}</p>
          </li>
        ))}
      </ul>

      <div className="grid">
        <Metric label="Data sources" value={report.dataSources.join(", ") || "None"} />
        <Metric label="Pair" value={report.market?.pairAddress ?? "Not found"} />
        <Metric label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
        <Metric label="Pair age" value={formatAge(report.market?.pairAgeHours)} />
      </div>

      <div className="report-actions">
        <span className="report-actions-label">Recommended next steps</span>
        <div className="report-actions-row">
          <NextActionBadge report={report} />
          {user && (
            <button
              className={`action-btn${watchlisted ? " action-btn-active" : ""}`}
              type="button"
              onClick={async () => {
                const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
                const { data: session } = await getSupabaseBrowserClient().auth.getSession();
                const token = session.session?.access_token;
                if (!token) return;

                if (watchlisted) {
                  await fetch(`/api/watchlist?chain=${report.chain}&address=${report.address}`, {
                    method: "DELETE",
                    headers: { authorization: `Bearer ${token}` }
                  });
                  setWatchlisted(false);
                  track("watchlist_removed", { chain: report.chain, address: report.address });
                  toast("Removed from watchlist.", "info");
                } else {
                  await fetch("/api/watchlist", {
                    method: "POST",
                    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
                    body: JSON.stringify({ chain: report.chain, address: report.address, tokenName: report.tokenName, tokenSymbol: report.tokenSymbol })
                  });
                  setWatchlisted(true);
                  track("watchlist_added", { chain: report.chain, address: report.address });
                  toast("Added to watchlist.", "success");
                }
              }}
            >
              {watchlisted ? "\u2713 Watchlisted" : "\u2606 Watchlist"}
            </button>
          )}
          <button className="action-btn" type="button" onClick={copyShareLink}>
            Share report
          </button>
        </div>
      </div>
    </section>
  );
}

function NextActionBadge({ report }: { report: ScanReport }) {
  if (report.riskLevel === "CRITICAL") {
    return <span className="action-badge action-badge-critical">Avoid this token</span>;
  }
  if (report.riskLevel === "HIGH") {
    return <span className="action-badge action-badge-high">Proceed with extreme caution</span>;
  }

  const hasAuthority = report.warnings.some((w) =>
    w.title.toLowerCase().includes("authority") || w.title.toLowerCase().includes("mint")
  );
  if (hasAuthority) {
    return <span className="action-badge action-badge-high">Verify authority is revoked</span>;
  }

  const hasLiquidity = report.warnings.some((w) =>
    w.title.toLowerCase().includes("liquidity") || w.title.toLowerCase().includes("lp")
  );
  if (hasLiquidity) {
    return <span className="action-badge action-badge-medium">Check LP lock status</span>;
  }

  if (report.riskLevel === "MEDIUM") {
    return <span className="action-badge action-badge-medium">Monitor before entry</span>;
  }

  return <span className="action-badge action-badge-low">Lower risk detected</span>;
}

function formatConfidence(confidence: ScanReport["confidence"]) {
  if (confidence === "HIGH") return "High";
  if (confidence === "MEDIUM") return "Medium";
  return "Limited data";
}
