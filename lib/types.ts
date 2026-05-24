export type Chain = "solana" | "base" | "bsc" | "ethereum";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Warning = {
  severity: RiskLevel;
  title: string;
  explanation: string;
  recommendation: string;
};

export type TokenInput = {
  chain: Chain;
  address: string;
};

export type MarketData = {
  dex?: string;
  pairAddress?: string;
  priceUsd?: string;
  liquidityUsd?: number;
  volume24h?: number;
  buys24h?: number;
  sells24h?: number;
  buys1h?: number;
  sells1h?: number;
  pairAgeHours?: number;
};

export type SolanaSecurityData = {
  mintAuthorityActive?: boolean;
  freezeAuthorityActive?: boolean;
  supply?: string;
  decimals?: number;
  largestHolderPct?: number;
  top10HolderPct?: number;
};

export type EvmSecurityData = {
  contractVerified?: boolean;
  ownerActive?: boolean;
  proxy?: boolean;
  mintable?: boolean;
  canBlacklist?: boolean;
  canTakeBackOwnership?: boolean;
  buyTax?: number;
  sellTax?: number;
  honeypot?: boolean;
  holderCount?: number;
  largestHolderPct?: number;
  top10HolderPct?: number;
  creatorAddress?: string;
  creatorBalancePct?: number;
  ownerBalancePct?: number;
};

export type ScanData = {
  chain: Chain;
  address: string;
  tokenName?: string;
  tokenSymbol?: string;
  market?: MarketData;
  solana?: SolanaSecurityData;
  evm?: EvmSecurityData;
  dataSources: string[];
};

export type ScanReport = ScanData & {
  reportId?: string;
  riskLevel: RiskLevel;
  score: number;
  warnings: Warning[];
  summary: string;
  generatedAt: string;
};

export type ReportSummary = {
  reportId: string;
  chain: Chain;
  address: string;
  tokenName?: string;
  tokenSymbol?: string;
  riskLevel: RiskLevel;
  score: number;
  liquidityUsd?: number;
  generatedAt: string;
};
