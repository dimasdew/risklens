export default function Loading() {
  return (
    <main className="shell compact-shell">
      <nav className="nav">
        <div className="brand">
          <span className="logo">RL</span>
          <span>RiskLens</span>
        </div>
      </nav>
      <div className="loading-skeleton">
        <div className="skeleton-block skeleton-lg"></div>
        <div className="skeleton-block skeleton-md"></div>
        <div className="skeleton-row">
          <div className="skeleton-block skeleton-sm"></div>
          <div className="skeleton-block skeleton-sm"></div>
          <div className="skeleton-block skeleton-sm"></div>
        </div>
      </div>
    </main>
  );
}
