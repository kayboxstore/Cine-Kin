import { createHash } from "node:crypto";
import { Hono } from "hono";
import * as cookie from "cookie";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ID = "cine-kin-test-client";
  process.env.APP_SECRET = "oauth-client-secret-test-only";
  process.env.SESSION_SECRET = "session-secret-test-only-0123456789-abcdefghij";
  process.env.KIMI_AUTH_URL = "https://auth.kimi.test";
  process.env.KIMI_OPEN_URL = "https://open.kimi.test";
  process.env.APP_BASE_URL = "https://cine.test";
});

import { OAuthTransaction, Paths } from "@contracts/constants";
import {
  createOAuthCallbackHandler,
  createOAuthStartHandler,
  type OAuthCallbackDependencies,
} from "./auth";
import { verifyOAuthTransaction } from "./oauth-transaction";

function transactionCookie(setCookie: string): string {
  const parsed = cookie.parse(setCookie);
  const value = parsed[OAuthTransaction.cookieName];
  if (!value) throw new Error("OAuth transaction cookie missing");
  return `${OAuthTransaction.cookieName}=${value}`;
}

async function beginOAuth() {
  const app = new Hono();
  app.get(Paths.oauthStart, createOAuthStartHandler());
  const response = await app.request("https://cine.test/api/oauth/start");
  const location = response.headers.get("location");
  const setCookie = response.headers.get("set-cookie");
  if (!location || !setCookie)
    throw new Error("OAuth start response incomplete");
  return { response, location: new URL(location), setCookie };
}

function callbackDependencies(): OAuthCallbackDependencies {
  return {
    exchangeAuthCode: vi.fn().mockResolvedValue({
      access_token: "provider-access-token",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "profile",
    }),
    verifyAccessToken: vi.fn().mockResolvedValue({
      userId: "user-123",
      clientId: "cine-kin-test-client",
    }),
    getProfile: vi.fn().mockResolvedValue({
      user_id: "user-123",
      name: "Administrateur Test",
      avatar_url: "https://example.test/avatar.png",
    }),
    upsertUser: vi.fn().mockResolvedValue(undefined),
    signSessionToken: vi.fn().mockResolvedValue("signed-admin-session"),
  };
}

describe("Kimi OAuth transaction", () => {
  it("starts OAuth server-side with a signed state cookie and PKCE S256", async () => {
    const { response, location, setCookie } = await beginOAuth();

    expect(response.status).toBe(302);
    expect(location.origin).toBe("https://auth.kimi.test");
    expect(location.pathname).toBe("/api/oauth/authorize");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://cine.test/api/oauth/callback"
    );
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");

    const rawCookie = cookie.parse(setCookie)[OAuthTransaction.cookieName];
    const transaction = await verifyOAuthTransaction(rawCookie);
    expect(transaction).not.toBeNull();
    expect(transaction?.state).toBe(location.searchParams.get("state"));
    expect(transaction?.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const expectedChallenge = createHash("sha256")
      .update(transaction!.codeVerifier!, "ascii")
      .digest("base64url");
    expect(location.searchParams.get("code_challenge")).toBe(expectedChallenge);
  });

  it("rejects a callback that has no browser-bound transaction cookie", async () => {
    const dependencies = callbackDependencies();
    const app = new Hono();
    app.get(Paths.oauthCallback, createOAuthCallbackHandler(dependencies));

    const response = await app.request(
      "https://cine.test/api/oauth/callback?code=code-1&state=state-1"
    );

    expect(response.status).toBe(400);
    expect(dependencies.exchangeAuthCode).not.toHaveBeenCalled();
  });

  it("rejects a state mismatch before exchanging the authorization code", async () => {
    const started = await beginOAuth();
    const dependencies = callbackDependencies();
    const app = new Hono();
    app.get(Paths.oauthCallback, createOAuthCallbackHandler(dependencies));

    const response = await app.request(
      "https://cine.test/api/oauth/callback?code=code-1&state=attacker-state",
      { headers: { cookie: transactionCookie(started.setCookie) } }
    );

    expect(response.status).toBe(400);
    expect(dependencies.exchangeAuthCode).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("consumes a valid transaction and sends its verifier to token exchange", async () => {
    const started = await beginOAuth();
    const rawCookie = cookie.parse(started.setCookie)[
      OAuthTransaction.cookieName
    ];
    const transaction = await verifyOAuthTransaction(rawCookie);
    const state = started.location.searchParams.get("state");
    const dependencies = callbackDependencies();
    const app = new Hono();
    app.get(Paths.oauthCallback, createOAuthCallbackHandler(dependencies));

    const response = await app.request(
      `https://cine.test/api/oauth/callback?code=valid-code&state=${state}`,
      { headers: { cookie: transactionCookie(started.setCookie) } }
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/admin");
    expect(dependencies.exchangeAuthCode).toHaveBeenCalledWith(
      "valid-code",
      "https://cine.test/api/oauth/callback",
      transaction?.codeVerifier
    );
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("ck_oauth_tx=");
    expect(cookies).toContain("Max-Age=0");
    expect(cookies).toContain("kimi_sid=signed-admin-session");
  });
});
