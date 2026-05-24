"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

type NavbarProps = {
  variant?: "landing" | "app";
};

export function Navbar({ variant = "app" }: NavbarProps) {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav">
      <Link className="brand brand-link" href="/">
        <span className="logo">RL</span>
        <span>RiskLens</span>
      </Link>

      <button
        className={`hamburger${menuOpen ? " hamburger-open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        type="button"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`nav-links${menuOpen ? " nav-links-open" : ""}`}>
        {variant === "landing" && (
          <>
            <a href="#how-it-works" className="nav-link" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" className="nav-link" onClick={() => setMenuOpen(false)}>Pricing</a>
          </>
        )}
        {variant === "app" && (
          <>
            <Link href="/#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link href="/#pricing" className="nav-link" onClick={() => setMenuOpen(false)}>Pricing</Link>
          </>
        )}
        {!loading && (
          user ? (
            <div className="nav-user">
              <Link href="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/scan" className="nav-cta" onClick={() => setMenuOpen(false)}>Scanner</Link>
              <button className="nav-user-btn" onClick={() => { signOut(); setMenuOpen(false); }} type="button">
                {user.email?.split("@")[0] ?? "Account"}
                <span className="nav-user-dot"></span>
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link href="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link href="/register" className="nav-cta" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          )
        )}
      </div>
    </nav>
  );
}
