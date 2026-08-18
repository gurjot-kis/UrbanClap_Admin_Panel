// Deterministic category → color mapping (hash of category id/name -> palette index)
// This is what drives the "category-wise theme" badges across the admin UI.

export interface CategoryTheme {
  bg: string;
  text: string;
  ring: string;
}

const PALETTE: CategoryTheme[] = [
  { bg: "#eef2ff", text: "#4338ca", ring: "#c7d2fe" }, // indigo
  { bg: "#ecfdf5", text: "#047857", ring: "#a7f3d0" }, // emerald
  { bg: "#fff7ed", text: "#c2410c", ring: "#fed7aa" }, // orange
  { bg: "#fdf2f8", text: "#be185d", ring: "#fbcfe8" }, // pink
  { bg: "#eff6ff", text: "#1d4ed8", ring: "#bfdbfe" }, // blue
  { bg: "#fefce8", text: "#a16207", ring: "#fef08a" }, // amber
  { bg: "#f0fdfa", text: "#0f766e", ring: "#99f6e4" }, // teal
  { bg: "#faf5ff", text: "#7e22ce", ring: "#e9d5ff" }, // purple
  { bg: "#fef2f2", text: "#b91c1c", ring: "#fecaca" }, // red
  { bg: "#f7fee7", text: "#4d7c0f", ring: "#d9f99d" }, // lime
];

export function categoryTheme(seed?: string | null): CategoryTheme {
  if (!seed) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}