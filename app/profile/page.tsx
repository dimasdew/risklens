"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Navbar } from "../components/Navbar";

type UserProfile = {
  user_id: string;
  username: string;
  updated_at: string;
};

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const client = getSupabaseBrowserClient();
        const { data } = await client
          .from("user_profiles")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle() as { data: UserProfile | null };

        if (data) {
          setUsername(data.username || "");
        }
        setEmail(user.email || "");
      } catch {
        // Ignore errors
      } finally {
        setLoadingProfile(false);
      }
    }
    void loadProfile();
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (username.length > 20) {
      setError("Username must be at most 20 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens.");
      return;
    }

    try {
      const client = getSupabaseBrowserClient();
      const { error: upsertError } = await (client.from("user_profiles") as any)
        .upsert({
          user_id: user!.id,
          username: username.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      setSuccess("Profile updated successfully!");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (loading || loadingProfile) {
    return (
      <main className="shell compact-shell">
        <Navbar />
        <div className="auth-page">
          <div className="auth-card">
            <p className="eyebrow">Profile</p>
            <h1 className="auth-title">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell compact-shell">
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Profile</p>
            <h1 className="auth-title">Account Settings</h1>
            <p className="auth-subtitle">Manage your account preferences.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="disabled-input"
              />
              <span className="field-hint">Email cannot be changed</span>
            </div>

            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
              />
              <span className="field-hint">3-20 characters, letters, numbers, underscores, hyphens only</span>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button className="scan-button auth-submit" type="submit">
              Save Changes
            </button>
          </form>

          <div className="profile-actions">
            <button className="btn-ghost" onClick={handleSignOut} type="button">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .disabled-input {
          background: var(--surface-2);
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field-hint {
          display: block;
          margin-top: 6px;
          font-size: var(--text-xs);
          color: var(--muted);
        }

        .success {
          margin-top: 14px;
          border: 1px solid var(--risk-low-border);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          color: var(--risk-low-text);
          background: var(--risk-low-bg);
        }

        .profile-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </main>
  );
}
