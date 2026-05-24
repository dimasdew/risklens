import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell compact-shell">
      <nav className="nav">
        <Link className="brand brand-link" href="/">
          <span className="logo">RL</span>
          <span>RiskLens</span>
        </Link>
      </nav>
      <section className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="eyebrow">404</p>
          <h1 className="auth-title">Page not found</h1>
          <p className="auth-subtitle">The page you&#39;re looking for doesn&#39;t exist or has been moved.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <Link href="/" className="btn-primary">Home</Link>
            <Link href="/scan" className="btn-ghost">Scanner</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
