import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { env, isKimiOAuthConfigured } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { OAuthTransaction, Paths, Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import { errorSummary, logEvent } from "../lib/observability";
import type { TokenResponse } from "./types";
import {
  createOAuthState,
  createPkcePair,
  oauthStateMatches,
  signOAuthTransaction,
  verifyOAuthTransaction,
} from "./oauth-transaction";

async function exchangeAuthCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    // Do not propagate the provider response body: it can contain transient
    // credentials or other data that must never reach application logs.
    throw new Error(`Token exchange failed with status ${resp.status}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

// Built lazily on first use: constructing `new URL(...)` from an empty
// KIMI_AUTH_URL throws, and eager evaluation at module load would crash the
// whole serverless function on import when Kimi OAuth is not configured
// (deployments using only the password-based admin login). Kept as a cached
// singleton so the remote JWKS is still fetched at most once per instance.
let jwksCache: ReturnType<typeof jose.createRemoteJWKSet> | undefined;
function getJwks(): ReturnType<typeof jose.createRemoteJWKSet> {
  if (!jwksCache) {
    if (!env.kimiAuthUrl) {
      throw new Error(
        "KIMI_AUTH_URL is not configured; OAuth login is disabled."
      );
    }
    jwksCache = jose.createRemoteJWKSet(
      new URL(`${env.kimiAuthUrl}/api/.well-known/jwks.json`)
    );
  }
  return jwksCache;
}

async function verifyAccessToken(
  accessToken: string
): Promise<{ userId: string; clientId: string }> {
  const { payload } = await jose.jwtVerify(accessToken, getJwks());
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  if (!clientId || clientId !== env.appId) {
    throw new Error("client_id does not match this OAuth application");
  }
  if (env.kimiTokenIssuer && payload.iss !== env.kimiTokenIssuer) {
    throw new Error("access token issuer is not allowed");
  }
  return { userId, clientId };
}

function oauthRedirectUri(c: Context): string {
  if (env.appBaseUrl) {
    const baseUrl = new URL(env.appBaseUrl);
    if (env.isProduction && baseUrl.protocol !== "https:") {
      throw new Error("APP_BASE_URL must use HTTPS in production");
    }
    return new URL(Paths.oauthCallback, baseUrl).toString();
  }
  if (env.isProduction) {
    throw new Error("APP_BASE_URL is required for OAuth in production");
  }
  return new URL(Paths.oauthCallback, c.req.url).toString();
}

function clearOAuthTransactionCookie(c: Context): void {
  setCookie(c, OAuthTransaction.cookieName, "", {
    ...getSessionCookieOptions(c.req.raw.headers),
    maxAge: 0,
  });
}

export function createOAuthStartHandler() {
  return async (c: Context) => {
    if (!isKimiOAuthConfigured()) {
      return c.json({ error: "La connexion Kimi n'est pas configurée." }, 503);
    }

    try {
      const redirectUri = oauthRedirectUri(c);
      const state = createOAuthState();
      const pkce = env.kimiOauthPkce ? createPkcePair() : null;
      const transaction = await signOAuthTransaction({
        state,
        redirectUri,
        ...(pkce ? { codeVerifier: pkce.verifier } : {}),
      });

      setCookie(c, OAuthTransaction.cookieName, transaction, {
        ...getSessionCookieOptions(c.req.raw.headers),
        maxAge: OAuthTransaction.maxAgeMs / 1000,
      });

      const url = new URL(`${env.kimiAuthUrl}/api/oauth/authorize`);
      url.searchParams.set("client_id", env.appId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "profile");
      url.searchParams.set("state", state);
      if (pkce) {
        url.searchParams.set("code_challenge", pkce.challenge);
        url.searchParams.set("code_challenge_method", "S256");
      }

      return c.redirect(url.toString(), 302);
    } catch (error) {
      logEvent("error", "oauth_start_failed", errorSummary(error));
      return c.json(
        { error: "Impossible de démarrer la connexion OAuth." },
        500
      );
    }
  };
}

export type OAuthCallbackDependencies = {
  exchangeAuthCode: typeof exchangeAuthCode;
  verifyAccessToken: typeof verifyAccessToken;
  getProfile: typeof kimiUsers.getProfile;
  upsertUser: typeof upsertUser;
  signSessionToken: typeof signSessionToken;
};

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

export function createOAuthCallbackHandler(
  overrides: Partial<OAuthCallbackDependencies> = {}
) {
  const dependencies: OAuthCallbackDependencies = {
    exchangeAuthCode,
    verifyAccessToken,
    getProfile: kimiUsers.getProfile,
    upsertUser,
    signSessionToken,
    ...overrides,
  };

  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    const transactionCookie = getCookie(c, OAuthTransaction.cookieName);
    clearOAuthTransactionCookie(c);

    if (error) {
      if (error === "access_denied") {
        return c.redirect(`${Paths.login}?oauth=cancelled`, 302);
      }
      logEvent("warn", "oauth_provider_rejected", {
        providerError: error,
        hasDescription: Boolean(errorDescription),
      });
      return c.json({ error: "Échec de l'autorisation OAuth." }, 400);
    }

    if (!code || !state || !transactionCookie) {
      return c.json({ error: "Transaction OAuth invalide ou expirée." }, 400);
    }

    try {
      const transaction = await verifyOAuthTransaction(transactionCookie);
      if (!transaction || !oauthStateMatches(transaction.state, state)) {
        return c.json({ error: "État OAuth invalide ou expiré." }, 400);
      }

      const tokenResp = await dependencies.exchangeAuthCode(
        code,
        transaction.redirectUri,
        transaction.codeVerifier
      );
      const { userId } = await dependencies.verifyAccessToken(
        tokenResp.access_token
      );
      const userProfile = await dependencies.getProfile(tokenResp.access_token);
      if (!userProfile) {
        throw new Error("Failed to fetch user profile from Kimi Open");
      }

      await dependencies.upsertUser({
        unionId: userId,
        name: userProfile.name,
        avatar: userProfile.avatar_url,
        lastSignInAt: new Date(),
      });

      const token = await dependencies.signSessionToken({
        unionId: userId,
        clientId: env.appId,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/admin", 302);
    } catch (error) {
      logEvent("error", "oauth_callback_failed", errorSummary(error));
      return c.json({ error: "Échec du rappel OAuth." }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
