import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

export const DEFAULT_SITE_ORIGIN = "https://7a5czmte3r3ri.kimi.page";

// Served verbatim in place of the real robots.txt whenever the site isn't
// meant to be indexed yet (VITE_SITE_INDEXING unset or not exactly "true").
// Deliberately no Sitemap: line — the sitemap is never advertised to
// crawlers in this mode.
export const DISALLOW_ALL_ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

export function resolvePublicSiteOrigin(configured?: string): string {
  const candidate = configured?.trim();
  if (!candidate) return DEFAULT_SITE_ORIGIN;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      "VITE_SITE_URL doit être une origine HTTPS valide, par exemple https://cinekin.example."
    );
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "VITE_SITE_URL doit contenir uniquement une origine HTTPS, sans identifiants, chemin, paramètres ni fragment."
    );
  }

  return url.origin;
}

export function replacePublicSiteOrigin(
  source: string,
  siteOrigin: string
): string {
  return source.replaceAll(DEFAULT_SITE_ORIGIN, siteOrigin);
}

// The only <meta name="robots"> tag in index.html; matched regardless of
// attribute order so a reformatted source tag doesn't silently stop working.
const ROBOTS_META_TAG_PATTERN = /<meta\b[^>]*\bname="robots"[^>]*>/;

export function buildRobotsMetaTag(siteIndexingEnabled: boolean): string {
  const content = siteIndexingEnabled ? "index, follow" : "noindex, nofollow";
  return `<meta data-static-seo="true" name="robots" content="${content}" />`;
}

export function applyRobotsMetaTag(
  html: string,
  siteIndexingEnabled: boolean
): string {
  return html.replace(
    ROBOTS_META_TAG_PATTERN,
    buildRobotsMetaTag(siteIndexingEnabled)
  );
}

export async function rewritePublicMetadataFiles(
  outputDirectory: string,
  siteOrigin: string,
  siteIndexingEnabled: boolean
): Promise<void> {
  const sitemapPath = path.join(outputDirectory, "sitemap.xml");
  const sitemapSource = await readFile(sitemapPath, "utf8");
  await writeFile(
    sitemapPath,
    replacePublicSiteOrigin(sitemapSource, siteOrigin),
    "utf8"
  );

  const robotsPath = path.join(outputDirectory, "robots.txt");
  const robotsContent = siteIndexingEnabled
    ? replacePublicSiteOrigin(await readFile(robotsPath, "utf8"), siteOrigin)
    : DISALLOW_ALL_ROBOTS_TXT;
  await writeFile(robotsPath, robotsContent, "utf8");
}

export function publicMetadataPlugin(options: {
  outputDirectory: string;
  siteOrigin: string;
  siteIndexingEnabled: boolean;
}): Plugin {
  return {
    name: "cine-kin-public-metadata",
    enforce: "post",
    transformIndexHtml(html) {
      const withOrigin = replacePublicSiteOrigin(html, options.siteOrigin);
      return applyRobotsMetaTag(withOrigin, options.siteIndexingEnabled);
    },
    async closeBundle() {
      await rewritePublicMetadataFiles(
        options.outputDirectory,
        options.siteOrigin,
        options.siteIndexingEnabled
      );
    },
  };
}
