"use client";

import { Navbar } from "../components/Navbar";

export default function BrandKitPage() {
  return (
    <main className="shell compact-shell">
      <Navbar />

      <section className="brandkit-container">
        <div className="brandkit-header">
          <p className="eyebrow">Design System</p>
          <h1>Brand Kit</h1>
          <p className="brandkit-subtitle">Typography, colors, spacing, and component styles for RiskLens.</p>
        </div>

        {/* Typography */}
        <section className="brandkit-section">
          <h2>Typography</h2>
          <div className="brandkit-grid">
            <div className="brandkit-item">
              <span className="brandkit-label">--text-3xl</span>
              <span style={{ fontSize: "var(--text-3xl)" }}>36px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-2xl</span>
              <span style={{ fontSize: "var(--text-2xl)" }}>28px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-xl</span>
              <span style={{ fontSize: "var(--text-xl)" }}>22px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-lg</span>
              <span style={{ fontSize: "var(--text-lg)" }}>18px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-base</span>
              <span style={{ fontSize: "var(--text-base)" }}>16px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-sm</span>
              <span style={{ fontSize: "var(--text-sm)" }}>14px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--text-xs</span>
              <span style={{ fontSize: "var(--text-xs)" }}>12px</span>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="brandkit-section">
          <h2>Colors</h2>
          <div className="brandkit-grid">
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--bg)" }}></div>
              <span className="brandkit-label">--bg</span>
              <span className="brandkit-value">#070a12</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--surface)" }}></div>
              <span className="brandkit-label">--surface</span>
              <span className="brandkit-value">#111827</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--text)" }}></div>
              <span className="brandkit-label">--text</span>
              <span className="brandkit-value">#edf4ff</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--muted)" }}></div>
              <span className="brandkit-label">--muted</span>
              <span className="brandkit-value">#9db0ce</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--green)" }}></div>
              <span className="brandkit-label">--green</span>
              <span className="brandkit-value">#48f5a4</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--blue)" }}></div>
              <span className="brandkit-label">--blue</span>
              <span className="brandkit-value">#66d9ff</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--amber)" }}></div>
              <span className="brandkit-label">--amber</span>
              <span className="brandkit-value">#ffca5c</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--orange)" }}></div>
              <span className="brandkit-label">--orange</span>
              <span className="brandkit-value">#ff9800</span>
            </div>
            <div className="brandkit-color">
              <div className="color-swatch" style={{ background: "var(--red)" }}></div>
              <span className="brandkit-label">--red</span>
              <span className="brandkit-value">#ff657d</span>
            </div>
          </div>
        </section>

        {/* Risk Colors */}
        <section className="brandkit-section">
          <h2>Risk Level Colors</h2>
          <div className="brandkit-grid">
            <div className="brandkit-risk">
              <div className="risk-swatch risk-critical">
                <span className="risk-label">CRITICAL</span>
              </div>
              <span className="brandkit-label">Critical</span>
              <span className="brandkit-value">var(--risk-critical-*)</span>
            </div>
            <div className="brandkit-risk">
              <div className="risk-swatch risk-high">
                <span className="risk-label">HIGH</span>
              </div>
              <span className="brandkit-label">High</span>
              <span className="brandkit-value">var(--risk-high-*)</span>
            </div>
            <div className="brandkit-risk">
              <div className="risk-swatch risk-medium">
                <span className="risk-label">MEDIUM</span>
              </div>
              <span className="brandkit-label">Medium</span>
              <span className="brandkit-value">var(--risk-medium-*)</span>
            </div>
            <div className="brandkit-risk">
              <div className="risk-swatch risk-low">
                <span className="risk-label">LOW</span>
              </div>
              <span className="brandkit-label">Low</span>
              <span className="brandkit-value">var(--risk-low-*)</span>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="brandkit-section">
          <h2>Spacing</h2>
          <div className="brandkit-grid">
            <div className="brandkit-item">
              <span className="brandkit-label">--space-xs</span>
              <span>4px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--space-sm</span>
              <span>8px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--space-md</span>
              <span>16px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--space-lg</span>
              <span>24px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--space-xl</span>
              <span>32px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--space-2xl</span>
              <span>48px</span>
            </div>
          </div>
        </section>

        {/* Radius */}
        <section className="brandkit-section">
          <h2>Border Radius</h2>
          <div className="brandkit-grid">
            <div className="brandkit-item">
              <span className="brandkit-label">--radius-xs</span>
              <span>8px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--radius-sm</span>
              <span>12px</span>
            </div>
            <div className="brandkit-item">
              <span className="brandkit-label">--radius</span>
              <span>20px</span>
            </div>
          </div>
        </section>

        {/* Component Examples */}
        <section className="brandkit-section">
          <h2>Components</h2>
          
          <div className="brandkit-subsection">
            <h3>Badges</h3>
            <div className="brandkit-examples">
              <span className="tier-badge tier-badge-pro">Pro</span>
              <span className="mini-risk mini-risk-critical">CRITICAL</span>
              <span className="mini-risk mini-risk-high">HIGH</span>
              <span className="mini-risk mini-risk-medium">MEDIUM</span>
              <span className="mini-risk mini-risk-low">LOW</span>
            </div>
          </div>

          <div className="brandkit-subsection">
            <h3>Action Badges</h3>
            <div className="brandkit-examples">
              <span className="action-badge action-badge-critical">Critical</span>
              <span className="action-badge action-badge-high">High</span>
              <span className="action-badge action-badge-medium">Medium</span>
              <span className="action-badge action-badge-low">Low</span>
            </div>
          </div>

          <div className="brandkit-subsection">
            <h3>Warning Cards</h3>
            <div className="brandkit-examples">
              <div className="warning warning-critical">
                <div className="warning-header">
                  <span className="warning-severity warning-severity-critical">CRITICAL</span>
                  <strong>Honeypot detected</strong>
                </div>
                <p>This token has suspicious patterns that suggest it may be a honeypot.</p>
                <p className="warning-rec">Recommendation: Avoid trading this token.</p>
              </div>
              <div className="warning warning-high">
                <div className="warning-header">
                  <span className="warning-severity warning-severity-high">HIGH</span>
                  <strong>Low liquidity</strong>
                </div>
                <p>Liquidity is below safe thresholds for trading.</p>
                <p className="warning-rec">Recommendation: Trade with caution.</p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <style jsx>{`
        .brandkit-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        .brandkit-header {
          margin-bottom: 48px;
        }

        .brandkit-header h1 {
          font-size: clamp(36px, 5vw, 56px);
          margin: 12px 0;
          letter-spacing: -0.04em;
        }

        .brandkit-subtitle {
          color: var(--muted);
          font-size: var(--text-base);
          max-width: 600px;
          line-height: 1.6;
        }

        .brandkit-section {
          margin-bottom: 48px;
        }

        .brandkit-section h2 {
          font-size: var(--text-xl);
          margin: 0 0 20px;
          letter-spacing: -0.03em;
        }

        .brandkit-subsection {
          margin-bottom: 24px;
        }

        .brandkit-subsection h3 {
          font-size: var(--text-base);
          margin: 0 0 12px;
          color: var(--muted);
        }

        .brandkit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }

        .brandkit-item {
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .brandkit-item span:last-child {
          font-size: var(--text-lg);
          font-weight: 600;
        }

        .brandkit-label {
          font-size: var(--text-xs);
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .brandkit-value {
          font-size: var(--text-xs);
          color: var(--muted);
          font-family: monospace;
        }

        .brandkit-color {
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .color-swatch {
          width: 100%;
          height: 48px;
          border-radius: var(--radius-xs);
          border: 1px solid var(--line);
        }

        .brandkit-risk {
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .risk-swatch {
          padding: 12px;
          border-radius: var(--radius-sm);
          text-align: center;
          font-weight: 700;
          font-size: var(--text-xs);
          text-transform: uppercase;
        }

        .risk-critical {
          background: var(--risk-critical-bg);
          border: 1px solid var(--risk-critical-border);
          color: var(--risk-critical-text);
        }

        .risk-high {
          background: var(--risk-high-bg);
          border: 1px solid var(--risk-high-border);
          color: var(--risk-high-text);
        }

        .risk-medium {
          background: var(--risk-medium-bg);
          border: 1px solid var(--risk-medium-border);
          color: var(--risk-medium-text);
        }

        .risk-low {
          background: var(--risk-low-bg);
          border: 1px solid var(--risk-low-border);
          color: var(--risk-low-text);
        }

        .brandkit-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .brandkit-examples .warning {
          flex: 1;
          min-width: 280px;
        }
      `}</style>
    </main>
  );
}
