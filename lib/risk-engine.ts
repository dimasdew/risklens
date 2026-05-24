import type { RiskLevel, ScanData, ScanReport, Warning } from "./types";

const severityWeight: Record<RiskLevel, number> = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 45,
  CRITICAL: 70
};

function addWarning(warnings: Warning[], warning: Warning) {
  warnings.push(warning);
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

function scoreWarnings(warnings: Warning[]) {
  return Math.min(
    100,
    warnings.reduce((total, warning) => total + severityWeight[warning.severity], 0)
  );
}

export function buildRiskReport(data: ScanData): ScanReport {
  const warnings: Warning[] = [];
  const liquidity = data.market?.liquidityUsd ?? 0;
  const hasUnknownLiquidity = Boolean(data.market?.pairAddress && !data.market?.liquidityUsd);
  const ageHours = data.market?.pairAgeHours;
  const largestHolderPct = data.chain === "solana" ? data.solana?.largestHolderPct : data.evm?.largestHolderPct;
  const top10HolderPct = data.chain === "solana" ? data.solana?.top10HolderPct : data.evm?.top10HolderPct;

  if (data.chain === "solana") {
    if (data.solana?.mintAuthorityActive) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "Mint authority is still active",
        explanation: "The creator can potentially mint more tokens and dilute holders.",
        recommendation: "Treat this as high risk unless the project has a clear reason and trusted multisig controls."
      });
    }

    if (data.solana?.freezeAuthorityActive) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "Freeze authority is still active",
        explanation: "The authority can freeze token accounts, which may block transfers for selected wallets.",
        recommendation: "Avoid buying unless freeze authority is expected and publicly justified."
      });
    }

  }

  if (data.chain !== "solana") {
    if (data.evm?.honeypot) {
      addWarning(warnings, {
        severity: "CRITICAL",
        title: "Possible honeypot detected",
        explanation: "The token may block selling or make selling economically impossible.",
        recommendation: "Do not buy unless an independent manual review proves sells are safe."
      });
    }

    if (data.evm?.canBlacklist) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "Blacklist controls detected",
        explanation: "The owner may be able to block selected wallets from transferring or selling.",
        recommendation: "Avoid tokens where blacklist powers are controlled by an unknown owner."
      });
    }

    if (data.evm?.mintable) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "Mint capability detected",
        explanation: "The contract may allow privileged accounts to create more supply.",
        recommendation: "Confirm the minter is renounced, timelocked, or controlled by a trusted multisig."
      });
    }

    if (data.evm?.ownerActive) {
      addWarning(warnings, {
        severity: "MEDIUM",
        title: "Owner privileges are still active",
        explanation: "A privileged owner can still change important token settings.",
        recommendation: "Look for renounced ownership, timelock controls, or transparent multisig governance."
      });
    }

    if (data.evm?.proxy) {
      addWarning(warnings, {
        severity: "MEDIUM",
        title: "Upgradeable proxy detected",
        explanation: "The implementation can potentially be changed after users buy the token.",
        recommendation: "Verify who controls upgrades and whether upgrades are timelocked."
      });
    }

    if ((data.evm?.sellTax ?? 0) >= 15 || (data.evm?.buyTax ?? 0) >= 15) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "High trading tax",
        explanation: `Detected buy tax ${data.evm?.buyTax ?? 0}% and sell tax ${data.evm?.sellTax ?? 0}%.`,
        recommendation: "High taxes can trap traders or drain value. Avoid unless expected."
      });
    }

    if ((data.evm?.creatorBalancePct ?? 0) >= 10 || (data.evm?.ownerBalancePct ?? 0) >= 10) {
      addWarning(warnings, {
        severity: "HIGH",
        title: "Dev or owner wallet holds significant supply",
        explanation: `Creator/owner balance appears to hold up to ${Math.max(data.evm?.creatorBalancePct ?? 0, data.evm?.ownerBalancePct ?? 0).toFixed(1)}% of supply.`,
        recommendation: "Check vesting, lockups, and whether this wallet has sold or transferred tokens."
      });
    }

    if ((data.evm?.holderCount ?? 0) > 0 && (data.evm?.holderCount ?? 0) < 100) {
      addWarning(warnings, {
        severity: "MEDIUM",
        title: "Low holder count",
        explanation: `GoPlus reports about ${data.evm?.holderCount} holders. Thin holder bases can be easier to manipulate.`,
        recommendation: "Wait for broader distribution or verify whether holders are real users."
      });
    }
  }

  if ((top10HolderPct ?? 0) >= 70) {
    addWarning(warnings, {
      severity: "HIGH",
      title: "Top 10 holders control most supply",
      explanation: `Top holders appear to control about ${top10HolderPct?.toFixed(1)}% of supply.`,
      recommendation: "Check whether these are liquidity, burn, CEX, or team wallets before entering."
    });
  } else if ((top10HolderPct ?? 0) >= 50) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "High top holder concentration",
      explanation: `Top holders appear to control about ${top10HolderPct?.toFixed(1)}% of supply.`,
      recommendation: "Review holder distribution and watch for coordinated sell pressure."
    });
  }

  if ((largestHolderPct ?? 0) >= 25) {
    addWarning(warnings, {
      severity: "HIGH",
      title: "Single wallet concentration risk",
      explanation: `The largest holder appears to control about ${largestHolderPct?.toFixed(1)}% of supply.`,
      recommendation: "Identify this wallet before buying. It may be liquidity, burn, team, or a whale wallet."
    });
  }

  if (liquidity > 0 && liquidity < 10_000) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "Low liquidity",
      explanation: `Detected liquidity is about $${Math.round(liquidity).toLocaleString()}. Small trades may move price heavily.`,
      recommendation: "Use caution and check whether liquidity is locked or burned."
    });
  }

  if (hasUnknownLiquidity) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "Liquidity is not verified",
      explanation: "RiskLens found a trading pair, but the data source did not return a verified USD liquidity value.",
      recommendation: "Check the pool or bonding curve manually before buying, especially for newly launched tokens."
    });
  }

  if (typeof ageHours === "number" && ageHours < 24) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "Very new trading pair",
      explanation: `The main pair appears to be about ${Math.max(1, Math.round(ageHours))} hour(s) old.`,
      recommendation: "New tokens have limited history. Wait for more trading data if possible."
    });
  }

  if (data.chain === "solana" && data.market?.dex?.toLowerCase() === "pumpfun" && typeof ageHours === "number" && ageHours < 24) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "New pump.fun launch",
      explanation: "This token appears to be trading on pump.fun and has limited market history.",
      recommendation: "Treat this as speculative until the token has deeper liquidity, holder history, and post-migration trading data."
    });
  }

  if (typeof ageHours === "number" && ageHours < 2 && ((data.market?.buys1h ?? 0) + (data.market?.sells1h ?? 0)) >= 150) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "High early trading velocity",
      explanation: `DexScreener reports about ${(data.market?.buys1h ?? 0) + (data.market?.sells1h ?? 0)} trades in the last hour on a very new pair.`,
      recommendation: "This may indicate launch hype, bot activity, snipers, or coordinated trading. Confirm with transaction-level analysis."
    });
  }

  if (data.chain === "solana" && typeof ageHours === "number" && ageHours < 24 && (data.solana?.recentActiveWallets ?? 0) >= 75) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "High recent wallet activity",
      explanation: `Helius found about ${data.solana?.recentActiveWallets} active wallets in recent token-related transactions.`,
      recommendation: "Review recent buyers for bot, sniper, or bundled wallet behavior before entering."
    });
  }

  if (data.chain === "solana" && (data.solana?.recentTxCount ?? 0) >= 100 && (data.solana?.recentTransferWallets ?? 0) < 20) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "Concentrated recent transaction activity",
      explanation: `Recent Helius data shows ${data.solana?.recentTxCount} transactions but only about ${data.solana?.recentTransferWallets} token transfer wallets.`,
      recommendation: "This can indicate repeated activity among a small wallet set. Check transaction clusters manually."
    });
  }

  if (data.chain !== "solana" && typeof ageHours === "number" && ageHours < 24 && (data.evm?.recentActiveWallets ?? 0) >= 75) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "High recent EVM wallet activity",
      explanation: `Moralis found about ${data.evm?.recentActiveWallets} active wallets in recent token transfers.`,
      recommendation: "Review recent transfers for fresh wallets, snipers, or coordinated activity before entering."
    });
  }

  if (data.chain !== "solana" && (data.evm?.recentTxCount ?? 0) >= 100 && (data.evm?.recentTransferWallets ?? 0) < 20) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "Concentrated EVM transfer activity",
      explanation: `Recent Moralis data shows ${data.evm?.recentTxCount} transfers but only about ${data.evm?.recentTransferWallets} active transfer wallets.`,
      recommendation: "This can indicate repeated transfers among a small wallet set. Check wallet clusters manually."
    });
  }

  if (!data.market?.pairAddress) {
    addWarning(warnings, {
      severity: "MEDIUM",
      title: "No active DEX pair found",
      explanation: "RiskLens could not find a tracked market pair for this token.",
      recommendation: "Verify liquidity manually before buying."
    });
  }

  const score = scoreWarnings(warnings);
  const riskLevel = levelFromScore(score);

  return {
    ...data,
    riskLevel,
    score,
    warnings,
    summary: buildSummary(riskLevel, warnings),
    generatedAt: new Date().toISOString()
  };
}

function buildSummary(riskLevel: RiskLevel, warnings: Warning[]) {
  if (warnings.length === 0) {
    return "No major automated warnings were found, but this is not a full audit.";
  }

  if (riskLevel === "CRITICAL") {
    return "Critical risk. The token has one or more red flags that may cause loss of funds or block selling.";
  }

  if (riskLevel === "HIGH") {
    return "High risk. Important owner, authority, liquidity, or distribution risks were detected.";
  }

  if (riskLevel === "MEDIUM") {
    return "Medium risk. Some warning signs exist and should be checked before buying.";
  }

  return "Low automated risk. Continue with normal due diligence before buying.";
}
