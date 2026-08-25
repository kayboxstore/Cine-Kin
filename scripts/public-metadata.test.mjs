import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_ORIGIN,
  replacePublicSiteOrigin,
  resolvePublicSiteOrigin,
  rewritePublicMetadataFiles,
} from "./lib/public-metadata.ts";

describe("public build metadata", () => {
  it("uses the current public origin when none is configured", () => {
    expect(resolvePublicSiteOrigin()).toBe(DEFAULT_SITE_ORIGIN);
    expect(resolvePublicSiteOrigin("   ")).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("normalizes a configured HTTPS origin", () => {
    expect(resolvePublicSiteOrigin(" https://cinekin.example/ ")).toBe(
      "https://cinekin.example"
    );
    expect(resolvePublicSiteOrigin("https://cinekin.example:8443")).toBe(
      "https://cinekin.example:8443"
    );
  });

  it.each([
    "http://cinekin.example",
    "https://user:secret@cinekin.example",
    "https://cinekin.example/path",
    "https://cinekin.example?preview=1",
    "https://cinekin.example#preview",
    "not-an-origin",
  ])("rejects an unsafe or ambiguous origin: %s", candidate => {
    expect(() => resolvePublicSiteOrigin(candidate)).toThrow("VITE_SITE_URL");
  });

  it("replaces every static occurrence without touching other URLs", () => {
    const source = `${DEFAULT_SITE_ORIGIN}/ ${DEFAULT_SITE_ORIGIN}/image.jpg https://fonts.example/font.css`;
    expect(replacePublicSiteOrigin(source, "https://cinekin.example")).toBe(
      "https://cinekin.example/ https://cinekin.example/image.jpg https://fonts.example/font.css"
    );
  });

  it("rewrites the copied robots and sitemap files in the build only", async () => {
    const outputDirectory = await mkdtemp(
      path.join(os.tmpdir(), "cine-kin-public-metadata-")
    );
    try {
      await Promise.all([
        writeFile(
          path.join(outputDirectory, "robots.txt"),
          `Sitemap: ${DEFAULT_SITE_ORIGIN}/sitemap.xml\n`,
          "utf8"
        ),
        writeFile(
          path.join(outputDirectory, "sitemap.xml"),
          `<loc>${DEFAULT_SITE_ORIGIN}/offres</loc>\n`,
          "utf8"
        ),
      ]);

      await rewritePublicMetadataFiles(
        outputDirectory,
        "https://cinekin.example"
      );

      const [robots, sitemap] = await Promise.all([
        readFile(path.join(outputDirectory, "robots.txt"), "utf8"),
        readFile(path.join(outputDirectory, "sitemap.xml"), "utf8"),
      ]);
      expect(robots).toBe("Sitemap: https://cinekin.example/sitemap.xml\n");
      expect(sitemap).toBe("<loc>https://cinekin.example/offres</loc>\n");
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
