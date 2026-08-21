export function PageSkeleton({ rows = 4 }: Readonly<{ rows?: number }>) {
  return <section className="skeleton-page" aria-label="Loading content" aria-busy="true"><div className="skeleton-line skeleton-eyebrow"/><div className="skeleton-line skeleton-title"/><div className="skeleton-grid">{Array.from({ length: rows }, (_, index) => <div className="skeleton-card" key={index}/>)}</div><div className="skeleton-panel"><div className="skeleton-line skeleton-heading"/>{Array.from({ length: 5 }, (_, index) => <div className="skeleton-line skeleton-row" key={index}/>)}</div></section>;
}
