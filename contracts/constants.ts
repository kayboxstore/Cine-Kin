export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

// Application-licence sessions — distinct cookies, kept separate from the admin
// (kimi_sid) session so the three auth systems never collide.
export const ClientSession = {
  cookieName: "ck_client_sid",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export const ResellerSession = {
  cookieName: "ck_reseller_sid",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;
