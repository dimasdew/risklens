import Link from "next/link";
import { notFound } from "next/navigation";
import { chainLabels } from "@/lib/chains";
import { formatAge, formatUsd } from "@/lib/format";
import { getReport } from "@/lib/report-store";
import { getSecuritySignals } from "@/lib/signals";
import type { ScanReport } from "@/lib/types";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="shell compact-shell">
      <nav className="nav compact-nav">
        <Link className="brand brand-link" href="/">
          <span className="logo">RL</span>
          <span>RiskLens</span>
        </Link>
        <span className="tag">Shared report</span>
      </nav>

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
