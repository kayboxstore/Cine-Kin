// Single predicate shared by the Vite build (HTML <meta name="robots">,
// robots.txt), the server (X-Robots-Tag header) and the client bundle
// (per-page SEO component): anything other than the exact string "true"
// means "do not index" — the safe default before a real public launch.
export function isSiteIndexingEnabled(value: string | undefined): boolean {
  return value?.trim() === "true";
}
