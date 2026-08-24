import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createReadinessHandler } from "./health";

describe("readiness endpoint", () => {
  it("reports ready only after the database check succeeds", async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    const app = new Hono();
    app.get("/api/health/ready", createReadinessHandler(check));

    const response = await app.request("https://cine.test/api/health/ready");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      checks: { database: "up" },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 without exposing the database error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const check = vi.fn().mockRejectedValue(new Error("secret connection URL"));
    const app = new Hono();
    app.get("/api/health/ready", createReadinessHandler(check));

    const response = await app.request("https://cine.test/api/health/ready");
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain('"database":"down"');
    expect(body).not.toContain("secret connection URL");
  });
});
