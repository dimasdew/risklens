import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listReports } from "@/lib/report-store";

export async function GET(request: Request) {
  const userId = await extractUserId(request);
  const reports = await listReports(30, userId ?? undefined);
  return NextResponse.json({ reports });
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
