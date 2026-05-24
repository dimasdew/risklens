import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const userId = await extractUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with latest scan score and lazily record score change events
  const items = await Promise.all(
    (data ?? []).map(async (item) => {
      const { data: scans } = await client
        .from("scan_reports")
        .select("score, risk_level, created_at")
        .eq("chain", item.chain)
        .eq("address", item.address)
        .order("created_at", { ascending: false })
        .limit(2);

      const latest = scans?.[0] ?? null;
      const previous = scans?.[1] ?? null;
      const scoreDelta = latest && previous ? latest.score - previous.score : null;

      // Lazy event: record score change if detected and not already recorded
      if (scoreDelta !== null && scoreDelta !== 0 && latest && previous) {
        const { data: existing } = await client
          .from("watchlist_events")
          .select("id")
          .eq("user_id", userId)
          .eq("chain", item.chain)
          .eq("address", item.address)
          .eq("previous_score", previous.score)
          .eq("new_score", latest.score)
          .maybeSingle();

        if (!existing) {
          await client.from("watchlist_events").insert({
            user_id: userId,
            chain: item.chain,
            address: item.address,
            event_type: "score_change",
            previous_score: previous.score,
            new_score: latest.score,
            previous_risk_level: previous.risk_level,
            new_risk_level: latest.risk_level
          });
        }
      }

      return {
        ...item,
        last_score: latest?.score ?? null,
        last_risk_level: latest?.risk_level ?? null,
        last_scanned_at: latest?.created_at ?? null,
        score_delta: scoreDelta
      };
    })
  );

  // Fetch undismissed events for this user
  const { data: events } = await client
    .from("watchlist_events")
    .select("*")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .order("detected_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ items, events: events ?? [] });
}

export async function POST(request: Request) {
  const userId = await extractUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json()) as {
    chain?: string;
    address?: string;
    tokenName?: string;
    tokenSymbol?: string;
  };

  const validChains = new Set(["solana", "ethereum", "base", "bsc"]);

  if (!body.chain || !validChains.has(body.chain)) {
    return NextResponse.json({ error: "Invalid or unsupported chain." }, { status: 400 });
  }

  if (!body.address || !isValidAddress(body.chain, body.address)) {
    return NextResponse.json({ error: "Invalid token address for selected chain." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Watchlist is not available yet." }, { status: 503 });
  }

  const client = getSupabaseServerClient();
  const id = `${userId}:${body.chain}:${body.address.toLowerCase()}`;

  const { error } = await client.from("watchlist").upsert({
    id,
    user_id: userId,
    chain: body.chain,
    address: body.address.toLowerCase(),
    token_name: body.tokenName ?? null,
    token_symbol: body.tokenSymbol ?? null,
    created_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await extractUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const chain = searchParams.get("chain");
  const address = searchParams.get("address");

  if (!chain || !address) {
    return NextResponse.json({ error: "Chain and address are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Watchlist is not available yet." }, { status: 503 });
  }

  const client = getSupabaseServerClient();
  const id = `${userId}:${chain}:${address.toLowerCase()}`;

  const { error } = await client.from("watchlist").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function isValidAddress(chain: string, address: string): boolean {
  if (chain === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function extractUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data } = await client.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
