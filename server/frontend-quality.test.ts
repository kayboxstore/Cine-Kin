import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("frontend quality safeguards", () => {
  it("keeps unverified volume claims out of static metadata", () => {
    const metadata = `${read("index.html")} ${read("public/manifest.json")}`;
    expect(metadata).not.toMatch(/15[\s\u202f]?000\+?/i);
    expect(metadata).not.toContain("G-XXXXXXXXXX");
    expect(metadata).toContain("og-image-v2.jpg");
  });

  it("uses valid PWA icon sizes and a non-restrictive orientation", () => {
    const manifest = JSON.parse(read("public/manifest.json")) as {
      orientation: string;
      icons: Array<{ src: string; sizes: string }>;
    };
    expect(manifest.orientation).toBe("any");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/favicon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/favicon-512.png", sizes: "512x512" }),
      ])
    );
  });

  it("uses network-first navigation and caches only hashed Vite assets", () => {
    const worker = read("public/service-worker.js");
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain("networkFirst(request, OFFLINE_SHELL)");
    expect(worker).toContain('url.pathname.startsWith("/assets/")');
    expect(worker).not.toContain("caches.match(event.request).then");
  });

  it("publishes a canonical URL while supporting noindex pages", () => {
    const seo = read("src/components/SEO.tsx");
    expect(seo).toContain("getCanonicalUrl(canonical)");
    expect(seo).toContain("noindex, nofollow");
    expect(seo).not.toContain("window.location.href");
  });

  it("keeps authenticated entry points out of search results", () => {
    const privatePages = [
      "src/pages/Login.tsx",
      "src/pages/admin/AdminPanel.tsx",
      "src/pages/client/ClientPortal.tsx",
      "src/pages/reseller/ResellerPortal.tsx",
    ];
    for (const page of privatePages) expect(read(page)).toContain("noIndex");
    const robots = read("public/robots.txt");
    for (const route of ["/admin", "/espace-client", "/login", "/revendeur"]) {
      expect(robots).toContain(`Disallow: ${route}`);
    }
  });

  it("exposes keyboard focus and a skip link", () => {
    expect(read("src/components/Layout.tsx")).toContain('href="#main-content"');
    const css = read("src/index.css");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 3px solid #a3b893 !important");
  });

  it("does not ship GSAP for decorative motion", () => {
    const packageJson = read("package.json");
    expect(packageJson).not.toContain('"gsap"');
    expect(packageJson).not.toContain('"@gsap/react"');
  });

  it("serves optimized brand assets", () => {
    expect(
      statSync(path.join(root, "public/images/logo-main-256.png")).size
    ).toBeLessThan(100_000);
    expect(
      statSync(path.join(root, "public/favicon-192.png")).size
    ).toBeLessThan(50_000);
    expect(
      statSync(path.join(root, "public/og-image-v2.jpg")).size
    ).toBeLessThan(100_000);
  });

  it("configures a real HTTP 404 fallback on Vercel", () => {
    const buildScript = read("scripts/build-vercel.mjs");
    expect(buildScript).toContain('dest: "/index.html", status: 404');
  });
});
