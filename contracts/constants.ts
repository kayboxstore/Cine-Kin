export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 8 * 60 * 60 * 1000,
} as const;

// Short-lived, HttpOnly OAuth transaction cookie. It binds the authorization
// callback to the browser that initiated the flow and carries the PKCE verifier.
export const OAuthTransaction = {
  cookieName: "ck_oauth_tx",
  maxAgeMs: 10 * 60 * 1000,
} as const;

// Application-licence sessions — distinct cookies, kept separate from the admin
// (kimi_sid) session so the three auth systems never collide.
export const ClientSession = {
  cookieName: "ck_client_sid",
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export const ResellerSession = {
  cookieName: "ck_reseller_sid",
  maxAgeMs: 12 * 60 * 60 * 1000,
} as const;

// Password-based admin session (alternative to the Kimi OAuth session).
export const AdminSession = {
  cookieName: "ck_admin_sid",
  maxAgeMs: 8 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthStatus: "/api/oauth/status",
  oauthStart: "/api/oauth/start",
  oauthCallback: "/api/oauth/callback",
} as const;
