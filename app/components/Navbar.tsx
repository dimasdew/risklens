"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

type NavbarProps = {
  variant?: "landing" | "app";
};

export function Navbar({ variant = "app" }: NavbarProps) {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="nav">
      <Link className="brand brand-link" href="/">
        <span className="logo">RL</span>
        <span>RiskLens</span>
      </Link>
      <div className="nav-links">
        {variant === "landing" && (
          <>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </>
        )}
        {variant === "app" && (
          <>
            <Link href="/#features" className="nav-link">Features</Link>
            <Link href="/#pricing" className="nav-link">Pricing</Link>
          </>
        )}
        {!loading && (
          user ? (
            <div className="nav-user">
              <Link href="/scan" className="nav-cta">Scanner</Link>
              <button className="nav-user-btn" onClick={signOut} type="button">
                {user.email?.split("@")[0] ?? "Account"}
                <span className="nav-user-dot"></span>
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link href="/login" className="nav-link">Log in</Link>
              <Link href="/register" className="nav-cta">Sign up</Link>
            </div>
          )
        )}
      </div>
    </nav>
  );
}
