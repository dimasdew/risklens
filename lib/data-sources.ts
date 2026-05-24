import type { Chain, EvmSecurityData, MarketData, ScanData, SolanaSecurityData } from "./types";

const evmChainIds: Record<Exclude<Chain, "solana">, string> = {
  ethereum: "1",
  bsc: "56",
  base: "8453"
};

const dexChainNames: Record<Chain, string> = {
  ethereum: "ethereum",
  bsc: "bsc",
  base: "base",
  solana: "solana"
};

export async function fetchScanData(chain: Chain, address: string): Promise<ScanData> {
  const sources = new Set<string>();
  const [market, chainSecurity] = await Promise.all([
    fetchDexScreener(chain, address).catch(() => undefined).then((data) => {
      if (data) sources.add("DexScreener");
      return data;
    }),
    chain === "solana"
      ? fetchSolanaSecurity(address).catch(() => undefined).then((data) => {
          if (data) sources.add("Solana RPC");
          return data;
        })
      : fetchGoPlusSecurity(chain, address).catch(() => undefined).then((data) => {
          if (data) sources.add("GoPlus Security");
          return data;
        })
  ]);

  return {
    chain,
    address,
    tokenName: market?.tokenName,
    tokenSymbol: market?.tokenSymbol,
    market,
    solana: chain === "solana" ? (chainSecurity as SolanaSecurityData | undefined) : undefined,
    evm: chain !== "solana" ? (chainSecurity as EvmSecurityData | undefined) : undefined,
    dataSources: Array.from(sources)
  };
}

async function fetchDexScreener(chain: Chain, address: string): Promise<(MarketData & { tokenName?: string; tokenSymbol?: string }) | undefined> {
  const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
    next: { revalidate: 20 }
  });

  if (!response.ok) return undefined;

  const payload = (await response.json()) as {
    pairs?: Array<{
      chainId?: string;
      dexId?: string;
      pairAddress?: string;
      priceUsd?: string;
      liquidity?: { usd?: number };
      volume?: { h24?: number };
      txns?: { h24?: { buys?: number; sells?: number }; h1?: { buys?: number; sells?: number } };
      pairCreatedAt?: number;
      baseToken?: { address?: string; name?: string; symbol?: string };
      quoteToken?: { address?: string; name?: string; symbol?: string };
    }>;
  };

  const pair = payload.pairs
    ?.filter((item) => item.chainId === dexChainNames[chain])
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

  if (!pair) return undefined;

  const token = pair.baseToken?.address?.toLowerCase() === address.toLowerCase() ? pair.baseToken : pair.quoteToken;

  return {
    dex: pair.dexId,
    pairAddress: pair.pairAddress,
    priceUsd: pair.priceUsd,
    liquidityUsd: pair.liquidity?.usd,
    volume24h: pair.volume?.h24,
    buys24h: pair.txns?.h24?.buys,
    sells24h: pair.txns?.h24?.sells,
    buys1h: pair.txns?.h1?.buys,
    sells1h: pair.txns?.h1?.sells,
    pairAgeHours: pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3_600_000 : undefined,
    tokenName: token?.name,
    tokenSymbol: token?.symbol
  };
}

async function fetchSolanaSecurity(address: string): Promise<SolanaSecurityData | undefined> {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const [accountInfo, supplyInfo, largestAccounts] = await Promise.all([
    solanaRpc(rpcUrl, "getParsedAccountInfo", [address]),
    solanaRpc(rpcUrl, "getTokenSupply", [address]),
    solanaRpc(rpcUrl, "getTokenLargestAccounts", [address])
  ]);

  const parsed = accountInfo?.result?.value?.data?.parsed?.info;
  const supplyValue = Number(supplyInfo?.result?.value?.amount ?? 0);
  const largest = (largestAccounts?.result?.value ?? []) as Array<{ amount?: string }>;
  const holderAmounts = largest.map((item) => Number(item.amount ?? 0)).filter(Number.isFinite);
  const top10Amount = holderAmounts.slice(0, 10).reduce((total, item) => total + item, 0);
  const largestAmount = holderAmounts[0] ?? 0;

  return {
    mintAuthorityActive: Boolean(parsed?.mintAuthority),
    freezeAuthorityActive: Boolean(parsed?.freezeAuthority),
    supply: supplyInfo?.result?.value?.uiAmountString,
    decimals: supplyInfo?.result?.value?.decimals,
    largestHolderPct: supplyValue ? (largestAmount / supplyValue) * 100 : undefined,
    top10HolderPct: supplyValue ? (top10Amount / supplyValue) * 100 : undefined
  };
}

async function solanaRpc(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    next: { revalidate: 20 }
  });

  if (!response.ok) return undefined;
  return response.json();
}

async function fetchGoPlusSecurity(chain: Exclude<Chain, "solana">, address: string): Promise<EvmSecurityData | undefined> {
  const chainId = evmChainIds[chain];
  const response = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`, {
    next: { revalidate: 20 }
  });

  if (!response.ok) return undefined;

  const payload = await response.json();
  const result = findGoPlusResult(payload?.result, address);
  if (!result) return undefined;

  return {
    contractVerified: result.is_open_source === "1",
    ownerActive: Boolean(result.owner_address) && result.owner_address !== "0x0000000000000000000000000000000000000000",
    proxy: result.is_proxy === "1",
    mintable: result.is_mintable === "1",
    canBlacklist: result.is_blacklisted === "1" || result.is_whitelisted === "1",
    canTakeBackOwnership: result.can_take_back_ownership === "1",
    buyTax: parseTax(result.buy_tax),
    sellTax: parseTax(result.sell_tax),
    honeypot: result.is_honeypot === "1",
    holderCount: parseOptionalNumber(result.holder_count),
    largestHolderPct: getLargestHolderPct(result.holders),
    top10HolderPct: getTopHolderPct(result.holders, 10),
    creatorAddress: typeof result.creator_address === "string" ? result.creator_address : undefined,
    creatorBalancePct: parsePercent(result.creator_percent),
    ownerBalancePct: parsePercent(result.owner_percent)
  };
}

function findGoPlusResult(result: unknown, address: string) {
  if (!result || typeof result !== "object") return undefined;
  const entries = Object.entries(result as Record<string, unknown>);
  return entries.find(([key]) => key.toLowerCase() === address.toLowerCase())?.[1] as Record<string, unknown> | undefined;
}

function parseTax(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function parseOptionalNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parsePercent(value: unknown) {
  const numeric = parseOptionalNumber(value);
  if (typeof numeric !== "number") return undefined;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function getTopHolderPct(value: unknown, count: number) {
  if (!Array.isArray(value)) return undefined;

  const total = value
    .slice(0, count)
    .reduce((sum, holder) => sum + (parsePercent((holder as { percent?: unknown }).percent) ?? 0), 0);

  return total > 0 ? total : undefined;
}

function getLargestHolderPct(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return parsePercent((value[0] as { percent?: unknown } | undefined)?.percent);
}
