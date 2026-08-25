import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

export const DEFAULT_SITE_ORIGIN = "https://7a5czmte3r3ri.kimi.page";

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

export async function rewritePublicMetadataFiles(
  outputDirectory: string,
  siteOrigin: string
): Promise<void> {
  await Promise.all(
    ["robots.txt", "sitemap.xml"].map(async filename => {
      const filePath = path.join(outputDirectory, filename);
      const source = await readFile(filePath, "utf8");
      await writeFile(
        filePath,
        replacePublicSiteOrigin(source, siteOrigin),
        "utf8"
      );
    })
  );
}

export function publicMetadataPlugin(options: {
  outputDirectory: string;
  siteOrigin: string;
}): Plugin {
  return {
    name: "cine-kin-public-metadata",
    enforce: "post",
    transformIndexHtml(html) {
      return replacePublicSiteOrigin(html, options.siteOrigin);
    },
    async closeBundle() {
      await rewritePublicMetadataFiles(
        options.outputDirectory,
        options.siteOrigin
      );
    },
  };
}
