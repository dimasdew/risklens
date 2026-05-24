"use client";

import Link from "next/link";
import { PricingSection } from "./components/PricingSection";
import { Navbar } from "./components/Navbar";

export default function Home() {
  return (
    <main>
      {/* ── Navbar ── */}
      <div className="shell">
        <Navbar variant="landing" />
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="shell">
          <div className="lp-hero-inner">
            <div className="lp-hero-content">
              <p className="eyebrow">Web3 Token Security</p>
              <h1>Don&#39;t trade blind.<br />Scan first.</h1>
              <p className="lead">
                RiskLens turns raw on-chain signals into a plain-language risk report: score, warnings,
                impact, and recommended action — in seconds, for free.
              </p>
              <div className="lp-hero-actions">
                <Link href="/scan" className="btn-primary">Scan a Token</Link>
                <a href="#how-it-works" className="btn-ghost">See how it works</a>
              </div>
            </div>

            <div className="lp-hero-visual">
              <div className="mock-report">
                <div className="mock-header">
                  <div>
                    <span className="mock-label">Sample Report</span>
                    <strong className="mock-token">PEPE (PEPE)</strong>
                    <span className="mock-chain">Ethereum</span>
                  </div>
                  <span className="mock-badge mock-badge-medium">MEDIUM</span>
                </div>
                <div className="mock-row">
                  <div className="mock-cell"><span>Score</span><strong>38/100</strong></div>
                  <div className="mock-cell"><span>Liquidity</span><strong>$2.4M</strong></div>
                  <div className="mock-cell"><span>Confidence</span><strong>High</strong></div>
                </div>
                <div className="mock-warnings">
                  <div className="mock-warning"><span className="mock-dot mock-dot-amber"></span>High top holder concentration</div>
                  <div className="mock-warning"><span className="mock-dot mock-dot-amber"></span>Owner privileges still active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chains ── */}
      <section className="lp-chains">
        <div className="shell">
          <p className="lp-chains-label">Supported chains</p>
          <div className="lp-chains-grid">
            <div className="chain-pill"><strong>Solana</strong></div>
            <div className="chain-pill"><strong>Ethereum</strong></div>
            <div className="chain-pill"><strong>Base</strong></div>
            <div className="chain-pill"><strong>BNB Chain</strong></div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section" id="how-it-works">
        <div className="shell">
          <div className="section-head section-head-center">
            <p className="eyebrow">How it works</p>
            <h2>Three steps. No wallet needed.</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">1</span>
              <strong>Paste address</strong>
              <p>Enter any token contract address and choose the chain.</p>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <strong>We scan everything</strong>
              <p>RiskLens checks liquidity, authorities, holder distribution, taxes, honeypot signals, and more.</p>
            </div>
            <div className="step-card">
              <span className="step-number">3</span>
              <strong>Get your report</strong>
              <p>A plain-language risk report with score, warnings, and recommendations — shareable with one link.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="shell">
          <div className="section-head section-head-center">
            <p className="eyebrow">What we check</p>
            <h2>Deep automated risk analysis.</h2>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon="shield"
              title="Authority & Owner Powers"
              description="Detects active mint authority, freeze authority, blacklist controls, proxy contracts, and take-back-ownership risks."
            />
            <FeatureCard
              icon="droplet"
              title="Liquidity & Market Health"
              description="Checks DEX liquidity depth, pair age, 24h volume, and flags very new or thin trading pairs."
            />
            <FeatureCard
              icon="eye"
              title="Honeypot & Tax Detection"
              description="Identifies honeypot contracts, excessive buy/sell taxes, and sell-blocking mechanisms on EVM chains."
            />
            <FeatureCard
              icon="users"
              title="Holder Concentration"
              description="Analyzes top holder distribution, largest wallet percentage, and dev/owner wallet balances."
            />
            <FeatureCard
              icon="activity"
              title="On-chain Activity Signals"
              description="Monitors recent transaction velocity, active wallet count, sniper patterns, and bot behavior indicators."
            />
            <FeatureCard
              icon="share"
              title="Shareable Reports"
              description="Every scan generates a unique URL you can share with your community, group chat, or followers."
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="lp-section">
        <div className="shell">
          <div className="lp-stats-grid">
            <div className="lp-stat">
              <strong>6+</strong>
              <span>Data sources per scan</span>
            </div>
            <div className="lp-stat">
              <strong>4</strong>
              <span>Chains supported</span>
            </div>
            <div className="lp-stat">
              <strong>50</strong>
              <span>Free scans per day</span>
            </div>
            <div className="lp-stat">
              <strong>0</strong>
              <span>Wallet connections needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div className="shell">
          <div className="lp-cta-card">
            <p className="eyebrow">Ready to scan?</p>
            <h2>Check any token before you trade.</h2>
            <p className="lp-cta-sub">Free. No wallet connection. No sign-up required.</p>
            <Link href="/scan" className="btn-primary btn-lg">Launch Scanner</Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <div className="shell" id="pricing">
        <PricingSection />
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="shell">
          <div className="lp-footer-inner">
            <div className="brand brand-link">
              <span className="logo">RL</span>
              <span>RiskLens</span>
            </div>
            <div className="lp-footer-links">
              <Link href="/scan">Scanner</Link>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
            </div>
            <p className="lp-footer-note">
              RiskLens is an automated scanner, not a full smart contract audit. Use it as a fast pre-check before deeper due diligence.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="feature-card">
      <span className={`feature-icon feature-icon-${icon}`}>{iconGlyph(icon)}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function iconGlyph(icon: string) {
  const map: Record<string, string> = {
    shield: "\u{1F6E1}",
    droplet: "\u{1F4A7}",
    eye: "\u{1F441}",
    users: "\u{1F465}",
    activity: "\u{26A1}",
    share: "\u{1F517}"
  };
  return map[icon] ?? "\u{2728}";
}
