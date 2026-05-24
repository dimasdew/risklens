import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import { getReport } from "@/lib/report-store";
import { getSecuritySignals } from "@/lib/signals";
import type { ScanReport } from "@/lib/types";
import { Metric } from "@/app/components/Metric";
import { ScoreBreakdown } from "@/app/components/ScoreBreakdown";
import { ReportNav } from "./report-nav";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return { title: "Report not found | RiskLens" };
  }

  const tokenLabel = report.tokenName
    ? `${report.tokenName}${report.tokenSymbol ? ` (${report.tokenSymbol})` : ""}`
    : "Unknown Token";
  const title = `${tokenLabel} | ${report.riskLevel} Risk | RiskLens`;
  const description = `${chainLabels[report.chain]} token risk report: score ${report.score}/100, ${report.riskLevel} risk. ${report.summary}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "RiskLens"
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="shell compact-shell">
      <ReportNav />
      <ReportCard report={report} />
    </main>
  );
}

function ReportCard({ report }: { report: ScanReport }) {
  const riskClass = `risk-badge risk-${report.riskLevel.toLowerCase()}`;

  return (
    <section className="result-card standalone-report">
      <div className="result-head">
        <div>
          <p className="eyebrow">RiskLens Report</p>
          <h1 className="report-title">
            {report.tokenName ?? "Unknown Token"} {report.tokenSymbol ? `(${report.tokenSymbol})` : ""}
          </h1>
          <p className="token-subtitle">
            {chainLabels[report.chain]} · {report.address}
          </p>
        </div>
        <div className={riskClass}>{report.riskLevel}</div>
      </div>

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
