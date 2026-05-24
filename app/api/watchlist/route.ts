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

  return NextResponse.json({ items: data ?? [] });
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

  if (!body.chain || !body.address) {
    return NextResponse.json({ error: "Chain and address are required." }, { status: 400 });
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
