const FALLBACK_SITE_ORIGIN = "https://7a5czmte3r3ri.kimi.page";

export function getSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Invalid optional configuration falls back to the current deployment.
    }
  }
  return typeof window === "undefined"
    ? FALLBACK_SITE_ORIGIN
    : window.location.origin;
}

export function getCanonicalUrl(canonical?: string): string {
  const pathname =
    canonical ??
    (typeof window === "undefined" ? "/" : window.location.pathname);
  const url = new URL(pathname, getSiteOrigin());
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function getAbsoluteAssetUrl(assetPath: string): string {
  return new URL(assetPath, getSiteOrigin()).toString();
}
