import { beforeEach, describe, expect, it, vi } from "vitest";

const shared = vi.hoisted(() => ({ execute: vi.fn() }));

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.RATE_LIMIT_STORE = "memory";
});

vi.mock("../queries/connection", () => ({
  getDb: () => ({ execute: shared.execute }),
}));

import { DatabaseRateLimitStore } from "./database-rate-limit-store";

describe("database rate-limit store", () => {
  beforeEach(() => {
    shared.execute.mockReset();
  });

  it("increments through the database and returns the shared counter window", async () => {
    const resetTime = new Date(Date.now() + 60_000);
    shared.execute
      .mockResolvedValueOnce([{}, []])
      .mockResolvedValueOnce([
        [{ totalHits: "3", resetTime: resetTime.toISOString() }],
        [],
      ]);
    const store = new DatabaseRateLimitStore("auth");
    store.init({ windowMs: 60_000 } as never);

    await expect(
      store.increment("203.0.113.10:reseller.login")
    ).resolves.toEqual({
      totalHits: 3,
      resetTime,
    });
    expect(store.localKeys).toBe(false);
    expect(shared.execute).toHaveBeenCalledTimes(2);
  });

  it("supports decrement and reset without keeping local state", async () => {
    shared.execute.mockResolvedValue([{}, []]);
    const store = new DatabaseRateLimitStore("api");

    await store.decrement("198.51.100.1");
    await store.resetKey("198.51.100.1");

    expect(shared.execute).toHaveBeenCalledTimes(2);
  });
});
