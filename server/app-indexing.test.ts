import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

function baseEnvironment(overrides: Record<string, string> = {}) {
  vi.stubEnv("APP_SECRET", "test-app-secret-0123456789-abcdefghij");
  vi.stubEnv("SESSION_SECRET", "test-session-secret-0123456789-abcdefghij");
  vi.stubEnv("ADMIN_PASSWORD", "correct-password");
  vi.stubEnv("TRUST_PROXY", "true");
  for (const [name, value] of Object.entries(overrides)) {
    vi.stubEnv(name, value);
  }
}

beforeAll(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("site-wide indexing switch — X-Robots-Tag header", () => {
  it("adds X-Robots-Tag: noindex, nofollow on every response by default (VITE_SITE_INDEXING unset)", async () => {
    baseEnvironment();
    const { default: app } = await import("./app");

    const live = await app.request("https://cine.test/api/health/live");
    expect(live.status).toBe(200);
    expect(live.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const notFound = await app.request("https://cine.test/api/unknown");
    expect(notFound.status).toBe(404);
    expect(notFound.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it('keeps the header for any value other than exactly "true"', async () => {
    baseEnvironment({ VITE_SITE_INDEXING: "1" });
    const { default: app } = await import("./app");

    const response = await app.request("https://cine.test/api/health/live");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it('omits X-Robots-Tag entirely once VITE_SITE_INDEXING is exactly "true"', async () => {
    baseEnvironment({ VITE_SITE_INDEXING: "true" });
    const { default: app } = await import("./app");

    const live = await app.request("https://cine.test/api/health/live");
    expect(live.status).toBe(200);
    expect(live.headers.has("x-robots-tag")).toBe(false);

    const notFound = await app.request("https://cine.test/api/unknown");
    expect(notFound.status).toBe(404);
    expect(notFound.headers.has("x-robots-tag")).toBe(false);
  });
});
