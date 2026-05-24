"use client";

import { useState } from "react";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import { getSecuritySignals } from "@/lib/signals";
import type { ScanReport } from "@/lib/types";
import { Metric } from "./Metric";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { useToast } from "./Toast";

export function Report({ report }: { report: ScanReport }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
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

function formatConfidence(confidence: ScanReport["confidence"]) {
  if (confidence === "HIGH") return "High";
  if (confidence === "MEDIUM") return "Medium";
  return "Limited data";
}
