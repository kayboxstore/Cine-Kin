import { afterEach, describe, expect, it, vi } from "vitest";

function productionEnvironment(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DATABASE_URL", "mysql://user:pass@db.example/cinekin");
  vi.stubEnv("SESSION_SECRET", "s".repeat(48));
  vi.stubEnv("ENCRYPTION_KEY", "e".repeat(48));
  for (const [name, value] of Object.entries(overrides)) {
    vi.stubEnv(name, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production environment guards", () => {
  it("rejects a short session-signing secret", async () => {
    productionEnvironment({ SESSION_SECRET: "too-short" });
    await expect(import("./env")).rejects.toThrow(
      "SESSION_SECRET must contain at least 32 characters"
    );
  });

  it("requires an encryption key distinct from OAuth configuration", async () => {
    productionEnvironment({ ENCRYPTION_KEY: "" });
    await expect(import("./env")).rejects.toThrow(
      "Missing required environment variable: ENCRYPTION_KEY"
    );
  });

  it("accepts dedicated production secrets of sufficient length", async () => {
    productionEnvironment();
    const { env } = await import("./env");
    expect(env.sessionSecret).toHaveLength(48);
    expect(env.encryptionKey).toHaveLength(48);
    expect(env.rateLimitStore).toBe("database");
  });

  it("rejects reused key material across security domains", async () => {
    const reused = "r".repeat(48);
    productionEnvironment({
      APP_SECRET: reused,
      SESSION_SECRET: reused,
    });
    await expect(import("./env")).rejects.toThrow("must use distinct values");
  });
});
