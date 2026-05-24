"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { Navbar } from "../components/Navbar";
import { useToast } from "../components/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { chainLabels } from "@/lib/chains";
import { formatUsd } from "@/lib/format";
import type { Chain, ReportSummary } from "@/lib/types";

type WatchlistItem = {
  id: string;
  chain: Chain;
  address: string;
  token_name: string | null;
  token_symbol: string | null;
  created_at: string;
  last_score: number | null;
  last_risk_level: string | null;
  last_scanned_at: string | null;
  score_delta: number | null;
};

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function loadReports() {
      try {
        const headers: Record<string, string> = {};
        const { data: session } = await getSupabaseBrowserClient().auth.getSession();
        if (session.session?.access_token) {
          headers.authorization = `Bearer ${session.session.access_token}`;
        }

        const response = await fetch("/api/reports", { headers });
        if (!response.ok) return;
        const payload = (await response.json()) as { reports?: ReportSummary[] };
        setReports(payload.reports ?? []);
      } finally {
        setLoading(false);
      }
    }

    async function loadWatchlist() {
      try {
        const { data: session } = await getSupabaseBrowserClient().auth.getSession();
        if (!session.session?.access_token) return;

        const response = await fetch("/api/watchlist", {
          headers: { authorization: `Bearer ${session.session.access_token}` }
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: WatchlistItem[] };
        setWatchlist(payload.items ?? []);
      } catch { /* ignore */ }
    }

    void loadReports();
    void loadWatchlist();
  }, []);

  async function removeFromWatchlist(chain: string, address: string) {
    const { data: session } = await getSupabaseBrowserClient().auth.getSession();
    if (!session.session?.access_token) return;

    await fetch(`/api/watchlist?chain=${chain}&address=${address}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${session.session.access_token}` }
    });

    setWatchlist((prev) => prev.filter((item) => !(item.chain === chain && item.address === address)));
    toast("Removed from watchlist.", "info");
  }

  async function handleSignOut() {
    await signOut();
    toast("Signed out.", "info");
  }

  if (authLoading || !user) {
    return (
      <main className="shell compact-shell">
        <Navbar />
        <div className="loading-skeleton">
          <div className="skeleton-block skeleton-lg"></div>
          <div className="skeleton-block skeleton-md"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell compact-shell">
      <Navbar />

      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="auth-title">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</h1>
          <p className="auth-subtitle">Manage your account and view your scan history.</p>
        </div>
      </section>

      <section className="dashboard-cards">
        <div className="dash-card">
          <span className="dash-card-label">Email</span>
          <strong>{user?.email ?? "Not set"}</strong>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Account created</span>
          <strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</strong>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Total scans</span>
          <strong>{reports.length}</strong>
        </div>
      </section>

      <section className="dashboard-actions">
        <Link href="/scan" className="btn-primary">Scan a Token</Link>
        <Link href="/reset-password" className="btn-ghost">Change password</Link>
        <button className="btn-ghost" onClick={handleSignOut} type="button">Sign out</button>
      </section>

      {watchlist.length > 0 && (
        <section className="dashboard-history">
          <h2>Watchlist</h2>
          <div className="recent-list">
            {watchlist.map((item) => (
              <div className="recent-item" key={item.id}>
                <div>
                  <strong>
                    {item.token_name ?? "Unknown Token"} {item.token_symbol ? `(${item.token_symbol})` : ""}
                    {item.last_score !== null && (
                      <span className={`mini-risk mini-risk-${(item.last_risk_level ?? "medium").toLowerCase()}`}>
                        {" "}{item.last_score}/100
                        {item.score_delta !== null && item.score_delta !== 0 && (
                          <span className={item.score_delta < 0 ? "delta-down" : "delta-up"}>
                            {" "}{item.score_delta > 0 ? "+" : ""}{item.score_delta}
                          </span>
                        )}
                      </span>
                    )}
                  </strong>
                  <span>
                    {chainLabels[item.chain]} · {shortAddress(item.address)}
                    {item.last_scanned_at ? ` · Last scanned ${new Date(item.last_scanned_at).toLocaleDateString()}` : ` · Added ${new Date(item.created_at).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="watchlist-actions">
                  <Link
                    href={`/scan?chain=${item.chain}&address=${item.address}`}
                    className="action-btn"
                  >
                    Rescan
                  </Link>
                  <button
                    className="action-btn"
                    type="button"
                    onClick={() => removeFromWatchlist(item.chain, item.address)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-history">
        <h2>Your scan history</h2>
        {loading ? (
          <div className="loading-skeleton">
            <div className="skeleton-block skeleton-md"></div>
            <div className="skeleton-block skeleton-md"></div>
          </div>
        ) : reports.length === 0 ? (
          <p className="auth-subtitle">No scans yet. Try scanning your first token.</p>
        ) : (
          <div className="recent-list">
            {reports.map((item) => (
              <a className="recent-item" href={`/report/${item.reportId}`} key={item.reportId}>
                <div>
                  <strong>
                    {item.tokenName ?? "Unknown Token"} {item.tokenSymbol ? `(${item.tokenSymbol})` : ""}
                  </strong>
                  <span>
                    {chainLabels[item.chain]} · {shortAddress(item.address)} · {new Date(item.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="recent-meta">
                  <span className={`mini-risk mini-risk-${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
                  <span>{item.score}/100</span>
                  <span>{formatUsd(item.liquidityUsd)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
