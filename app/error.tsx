"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="logo">RL</span>
          <span>RiskLens</span>
        </div>
      </nav>
      <section className="result-card">
        <div className="result-head">
          <div>
            <h2 className="token-title">Something went wrong</h2>
            <p className="token-subtitle">
              {error.message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
        </div>
        <button className="scan-button" onClick={reset} style={{ marginTop: 18 }}>
          Try again
        </button>
      </section>
    </main>
  );
}
