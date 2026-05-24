import { chainLabels } from "@/lib/chains";
import { formatUsd } from "@/lib/format";
import type { ReportSummary } from "@/lib/types";

export function RecentScans({ reports }: { reports: ReportSummary[] }) {
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

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
