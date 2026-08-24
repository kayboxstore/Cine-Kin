import { describe, expect, it } from "vitest";
import { runStagingSmoke, stagingOrigin } from "./staging-smoke.mjs";

const requestId = "123e4567-e89b-12d3-a456-426614174000";

function response(body, status, contentType, extraHeaders = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: {
      "content-type": contentType,
      ...extraHeaders,
    },
  });
}

function healthyFetch(input) {
  const pathname = new URL(input).pathname;
  if (pathname === "/" || pathname === "/login") {
    return Promise.resolve(response("<!doctype html>", 200, "text/html"));
  }
  if (pathname === "/api/health/live") {
    return Promise.resolve(
      response({ ok: true }, 200, "application/json", {
        "cache-control": "no-store",
        "content-security-policy": "default-src 'self'; script-src 'self'",
        "x-content-type-options": "nosniff",
        "x-request-id": requestId,
      })
    );
  }
  if (pathname === "/api/health/ready") {
    return Promise.resolve(
      response(
        { ok: true, checks: { database: "up" } },
        200,
        "application/json"
      )
    );
  }
  if (pathname === "/api/oauth/status") {
    return Promise.resolve(
      response({ enabled: false }, 200, "application/json")
    );
  }
  if (pathname.startsWith("/api/")) {
    return Promise.resolve(
      response({ error: "Not Found" }, 404, "application/json")
    );
  }
  return Promise.resolve(response("<!doctype html>", 404, "text/html"));
}

describe("staging HTTP smoke checks", () => {
  it("accepts a healthy public staging deployment", async () => {
    const report = await runStagingSmoke(
      "https://staging.cine-kin.example",
      healthyFetch
    );
    expect(report.ok).toBe(true);
    expect(report.checks).toHaveLength(7);
    expect(report.checks.every(check => check.ok)).toBe(true);
  });

  it("surfaces a failed database readiness check", async () => {
    const failingFetch = input => {
      if (new URL(input).pathname === "/api/health/ready") {
        return Promise.resolve(
          response(
            { ok: false, checks: { database: "down" } },
            503,
            "application/json"
          )
        );
      }
      return healthyFetch(input);
    };
    const report = await runStagingSmoke(
      "https://staging.cine-kin.example",
      failingFetch
    );
    expect(report.ok).toBe(false);
    expect(
      report.checks.find(check => check.name === "disponibilité MySQL")
    ).toMatchObject({ ok: false });
  });

  it("refuses non-HTTPS or path-bearing staging URLs", () => {
    expect(() => stagingOrigin("http://staging.example")).toThrow("HTTPS");
    expect(() => stagingOrigin("https://staging.example/app")).toThrow(
      "origine"
    );
  });
});
