import type { ScanReport } from "@/lib/types";

export function ScoreBreakdown({ report }: { report: ScanReport }) {
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

function warningPoints(warning: ScanReport["warnings"][number]) {
  if (typeof warning.points === "number") return warning.points;
  if (warning.severity === "CRITICAL") return 70;
  if (warning.severity === "HIGH") return 45;
  if (warning.severity === "MEDIUM") return 25;
  return 10;
}
