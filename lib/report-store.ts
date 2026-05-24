import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { ReportSummary, ScanReport } from "./types";

const reportsDir = process.env.VERCEL ? path.join("/tmp", "risklens", "reports") : path.join(process.cwd(), ".data", "reports");
const tableName = "scan_reports";

export async function saveReport(report: ScanReport): Promise<ScanReport> {
  const reportId = createReportId(report);
  const storedReport = { ...report, reportId };

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from(tableName).upsert({
        id: reportId,
        chain: storedReport.chain,
        address: storedReport.address,
        token_name: storedReport.tokenName,
        token_symbol: storedReport.tokenSymbol,
        risk_level: storedReport.riskLevel,
        score: storedReport.score,
        liquidity_usd: storedReport.market?.liquidityUsd,
        report: storedReport,
        created_at: storedReport.generatedAt
      });

      if (!error) return storedReport;
      console.error("Supabase save failed, falling back to local storage:", error.message);
    } catch (error) {
      console.error("Supabase save failed, falling back to local storage:", error);
    }
  }

  if (process.env.VERCEL) {
    console.warn("Supabase is not configured. Using temporary Vercel storage for this scan only.");
  }

  return saveLocalReport(storedReport);
}

export async function getReport(reportId: string): Promise<ScanReport | null> {
  if (!isValidReportId(reportId)) return null;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.from(tableName).select("report").eq("id", reportId).maybeSingle();

      if (!error && data?.report) return data.report as ScanReport;
      if (error) console.error("Supabase get failed, falling back to local storage:", error.message);
    } catch (error) {
      console.error("Supabase get failed, falling back to local storage:", error);
    }
  }

  return getLocalReport(reportId);
}

export async function listReports(limit = 10): Promise<ReportSummary[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from(tableName)
        .select("id, chain, address, token_name, token_symbol, risk_level, score, liquidity_usd, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.map((row) => ({
          reportId: row.id,
          chain: row.chain,
          address: row.address,
          tokenName: row.token_name ?? undefined,
          tokenSymbol: row.token_symbol ?? undefined,
          riskLevel: row.risk_level,
          score: row.score,
          liquidityUsd: row.liquidity_usd ?? undefined,
          generatedAt: row.created_at
        })) as ReportSummary[];
      }

      if (error) console.error("Supabase list failed, falling back to local storage:", error.message);
    } catch (error) {
      console.error("Supabase list failed, falling back to local storage:", error);
    }
  }

  return listLocalReports(limit);
}

async function saveLocalReport(report: ScanReport): Promise<ScanReport> {
  await mkdir(reportsDir, { recursive: true });
  await writeFile(reportPath(report.reportId!), JSON.stringify(report, null, 2), "utf8");
  return report;
}

async function getLocalReport(reportId: string): Promise<ScanReport | null> {
  try {
    const content = await readFile(reportPath(reportId), "utf8");
    return JSON.parse(content) as ScanReport;
  } catch {
    return null;
  }
}

async function listLocalReports(limit = 10): Promise<ReportSummary[]> {
  try {
    const files = await readdir(reportsDir);
    const reports = await Promise.all(
      files
        .filter((file) => /^[a-f0-9]{16}\.json$/.test(file))
        .map((file) => readLocalReportSummary(path.basename(file, ".json")))
    );

    return reports
      .filter((report): report is ReportSummary => Boolean(report))
      .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

async function readLocalReportSummary(reportId: string): Promise<ReportSummary | null> {
  const report = await getLocalReport(reportId);
  if (!report?.reportId) return null;

  return {
    reportId: report.reportId,
    chain: report.chain,
    address: report.address,
    tokenName: report.tokenName,
    tokenSymbol: report.tokenSymbol,
    riskLevel: report.riskLevel,
    score: report.score,
    liquidityUsd: report.market?.liquidityUsd,
    generatedAt: report.generatedAt
  };
}

function createReportId(report: ScanReport) {
  return createHash("sha256")
    .update(`${report.chain}:${report.address}:${report.generatedAt}:${report.score}`)
    .digest("hex")
    .slice(0, 16);
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

function isValidReportId(reportId: string) {
  return /^[a-f0-9]{16}$/.test(reportId);
}

function reportPath(reportId: string) {
  return path.join(reportsDir, `${reportId}.json`);
}
