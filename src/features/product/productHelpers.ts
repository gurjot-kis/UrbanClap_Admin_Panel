import type { Product } from "./productTypes";

const ASSET_BASE_URL = import.meta.env.VITE_API_ASSET_URL ?? "";

export const resolveImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_URL}${normalized}`;
};

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24)
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
};

export const priceRangeLabel = (product: Product): string => {
  if (!product.variants?.length) return formatPrice(product.basePrice);
  const prices = product.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
};
