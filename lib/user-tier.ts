import { isSupabaseConfigured, getSupabaseServerClient } from "./supabase-server";

export type UserTier = "free" | "pro" | "admin";

export type TierInfo = {
  tier: UserTier;
  scanLimit: number;
};

const defaultFree: TierInfo = { tier: "free", scanLimit: 50 };
const proTier: TierInfo = { tier: "pro", scanLimit: 999999 };
const adminTier: TierInfo = { tier: "admin", scanLimit: 999999 };

const adminUserIds = new Set(
  (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
);

export async function getUserTier(userId: string | null | undefined): Promise<TierInfo> {
  if (!userId) return defaultFree;

  // Admin bypass via env var
  if (adminUserIds.has(userId)) return adminTier;

  if (!isSupabaseConfigured()) return defaultFree;

  try {
    const client = getSupabaseServerClient();
    const { data } = await client
      .from("user_tiers")
      .select("tier, scan_limit")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return defaultFree;

    const tier = data.tier as UserTier;
    return {
      tier,
      scanLimit: tier === "free" ? data.scan_limit : 999999
    };
  } catch {
    return defaultFree;
  }
}
