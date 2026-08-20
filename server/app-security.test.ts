import { beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.APP_SECRET = "test-app-secret-0123456789-abcdefghij";
  process.env.ADMIN_PASSWORD = "correct-password";
});

import app from "./app";

beforeAll(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

function post(
  url: string,
  ip: string,
  extraHeaders: Record<string, string> = {}
) {
  return app.request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...extraHeaders,
    },
    body: "{}",
  });
}

describe("Hono authentication perimeter", () => {
  it("blocks a batched admin-login request before tRPC executes it", async () => {
    const response = await post(
      "http://cine.test/api/trpc/auth.adminLogin,auth.adminLogin?batch=1",
      "198.51.100.10"
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("batching"),
    });
  });

  it("blocks cross-origin browser mutations", async () => {
    const response = await post(
      "http://cine.test/api/trpc/auth.adminLogin",
      "198.51.100.11",
      {
        host: "cine.test",
        origin: "https://attacker.test",
      }
    );
    expect(response.status).toBe(403);
  });

  it("applies the dedicated ten-attempt quota to one sensitive procedure", async () => {
    const url = "http://cine.test/api/trpc/auth.adminLogin";
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await post(url, "198.51.100.12");
      expect(response.status).not.toBe(429);
    }
    const blocked = await post(url, "198.51.100.12");
    expect(blocked.status).toBe(429);
  });
});
