interface CatalogFreshnessProps { updatedAt?: string; stale?: boolean; className?: string }

export default function CatalogFreshness({ updatedAt, stale, className = '' }: CatalogFreshnessProps) {
  const date = updatedAt ? new Date(updatedAt) : null;
  const valid = date && Number.isFinite(date.getTime());
  return <p className={`text-xs text-muted ${className}`}>
    {valid ? <>Catalog updated <time dateTime={updatedAt}>{date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></> : 'Catalog update time unavailable'}
    {stale && ' · Showing the last available catalog'}
  </p>;
}
