"use client";

import { useState } from "react";
import Link from "next/link";
import { WaitlistModal } from "./WaitlistModal";

export function PricingSection() {
  const [waitlistPlan, setWaitlistPlan] = useState<string | null>(null);

  return (
    <section className="pricing-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Plans</p>
          <h2>Built for traders and communities</h2>
        </div>
        <span className="tag">Pro features coming next</span>
      </div>

      <div className="pricing-grid">
        <PlanCard
          cta="Current plan"
          ctaHref="/scan"
          description="Fast token checks for casual research."
          features={["50 scans per day", "Shareable risk reports", "Stored scan history", "Solana and EVM coverage"]}
          name="Free"
          price="$0"
        />
        <PlanCard
          cta="Join Pro waitlist"
          description="Monitoring and alerts for active token research."
          featured
          features={["Unlimited scans", "Token watchlist", "Liquidity and authority alerts", "Advanced wallet activity signals"]}
          name="Pro"
          onCtaClick={() => setWaitlistPlan("pro")}
          price="$19/mo"
        />
        <PlanCard
          cta="Contact for access"
          description="Automated risk checks for groups and tooling."
          features={["Telegram group bot", "Batch scans", "API access", "Webhook alerts"]}
          name="Community and API"
          onCtaClick={() => setWaitlistPlan("community")}
          price="Custom"
        />
      </div>

      <div className="watchlist-preview">
        <div>
          <strong>Watchlist alerts preview</strong>
          <p>Track tokens and get notified when liquidity, authority, holder concentration, or activity risk changes.</p>
        </div>
        <span>Coming next</span>
      </div>

      {waitlistPlan && (
        <WaitlistModal plan={waitlistPlan} onClose={() => setWaitlistPlan(null)} />
      )}
    </section>
  );
}

function PlanCard({
  cta,
  ctaHref,
  description,
  featured = false,
  features,
  name,
  onCtaClick,
  price
}: {
  cta: string;
  ctaHref?: string;
  description: string;
  featured?: boolean;
  features: string[];
  name: string;
  onCtaClick?: () => void;
  price: string;
}) {
  return (
    <article className={`plan-card${featured ? " plan-card-featured" : ""}`}>
      <div>
        <span className="plan-name">{name}</span>
        <strong>{price}</strong>
        <p>{description}</p>
      </div>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {ctaHref ? (
        <Link href={ctaHref} className="plan-cta-link">{cta}</Link>
      ) : (
        <button type="button" onClick={onCtaClick}>{cta}</button>
      )}
    </article>
  );
}
