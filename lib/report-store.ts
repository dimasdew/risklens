import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { ScanReport } from "./types";

const reportsDir = path.join(process.cwd(), ".data", "reports");

export async function saveReport(report: ScanReport): Promise<ScanReport> {
  await mkdir(reportsDir, { recursive: true });

  const reportId = createReportId(report);
  const storedReport = { ...report, reportId };
  await writeFile(reportPath(reportId), JSON.stringify(storedReport, null, 2), "utf8");
  return storedReport;
}

export async function getReport(reportId: string): Promise<ScanReport | null> {
  if (!/^[a-f0-9]{16}$/.test(reportId)) return null;

  try {
    const content = await readFile(reportPath(reportId), "utf8");
    return JSON.parse(content) as ScanReport;
  } catch {
    return null;
  }
}

function createReportId(report: ScanReport) {
  return createHash("sha256")
    .update(`${report.chain}:${report.address}:${report.generatedAt}:${report.score}`)
    .digest("hex")
    .slice(0, 16);
}

function reportPath(reportId: string) {
  return path.join(reportsDir, `${reportId}.json`);
}
