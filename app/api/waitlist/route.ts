import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      plan?: string;
      useCase?: string;
    };

    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const plan = body.plan || "pro";
    const useCase = body.useCase?.trim().slice(0, 500) || null;

    if (isSupabaseConfigured()) {
      const client = getSupabaseServerClient();
      const { error } = await client.from("waitlist_signups").upsert(
        { email, plan, use_case: useCase, created_at: new Date().toISOString() },
        { onConflict: "email" }
      );

      if (error) {
        console.error("Waitlist signup failed:", error.message);
        return NextResponse.json({ error: "Could not save your signup. Please try again." }, { status: 500 });
      }
    } else {
      console.log("[waitlist-signup]", { email, plan, useCase });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
