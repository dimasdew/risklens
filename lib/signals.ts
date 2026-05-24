import type { ScanReport } from "./types";

export function getSecuritySignals(report: ScanReport) {
  const largestHolderPct = report.chain === "solana" ? report.solana?.largestHolderPct : report.evm?.largestHolderPct;
  const top10HolderPct = report.chain === "solana" ? report.solana?.top10HolderPct : report.evm?.top10HolderPct;
  const devHoldingPct = Math.max(report.evm?.creatorBalancePct ?? 0, report.evm?.ownerBalancePct ?? 0);
  const buys1h = report.market?.buys1h ?? 0;
  const sells1h = report.market?.sells1h ?? 0;
  const recentActiveWallets = report.chain === "solana" ? report.solana?.recentActiveWallets : report.evm?.recentActiveWallets;
  const recentTxCount = report.chain === "solana" ? report.solana?.recentTxCount : report.evm?.recentTxCount;

  return [
    { label: "Top 10 holders", value: formatPct(top10HolderPct) },
    { label: "Largest holder", value: formatPct(largestHolderPct) },
    { label: "Dev/owner holding", value: devHoldingPct > 0 ? formatPct(devHoldingPct) : "Unknown" },
    { label: "Holder count", value: report.evm?.holderCount ? report.evm.holderCount.toLocaleString() : "Unknown" },
    { label: "1h buys/sells", value: buys1h || sells1h ? `${buys1h}/${sells1h}` : "Unknown" },
    { label: "Recent wallets", value: recentActiveWallets ? recentActiveWallets.toLocaleString() : "Unknown" },
    { label: "Recent txs", value: recentTxCount ? recentTxCount.toLocaleString() : "Unknown" },
    { label: "Authority risk", value: getAuthorityRisk(report) }
  ].filter((signal) => signal.value !== "Unknown");
}

function getAuthorityRisk(report: ScanReport) {
  if (report.chain === "solana") {
    const active = [report.solana?.mintAuthorityActive, report.solana?.freezeAuthorityActive].filter(Boolean).length;
    if (active === 2) return "Mint + freeze active";
    if (report.solana?.mintAuthorityActive) return "Mint active";
    if (report.solana?.freezeAuthorityActive) return "Freeze active";
    return "No active authority found";
  }

  const risks = [report.evm?.ownerActive, report.evm?.mintable, report.evm?.canBlacklist].filter(Boolean).length;
  if (risks >= 2) return "Multiple owner powers";
  if (report.evm?.ownerActive) return "Owner active";
  if (report.evm?.mintable) return "Mintable";
  if (report.evm?.canBlacklist) return "Blacklist controls";
  return "No major owner powers found";
}

function formatPct(value?: number) {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "Unknown";
}
