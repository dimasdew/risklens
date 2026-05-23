export function formatUsd(value?: number) {
  if (!value) return "Unknown";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatAge(hours?: number) {
  if (typeof hours !== "number") return "Unknown";
  if (hours < 48) return `${Math.max(1, Math.round(hours))}h`;
  return `${Math.round(hours / 24)}d`;
}
