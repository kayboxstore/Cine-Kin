import type { CookieOptions } from "hono/utils/cookie";
import * as cookie from "cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "Lax" : "None",
    secure: !localhost,
  };
}

// Append a Set-Cookie header for a session token (used by the tRPC login
// mutations, which write to ctx.resHeaders rather than a Hono context).
export function appendSessionCookie(
  resHeaders: Headers,
  reqHeaders: Headers,
  name: string,
  value: string,
  maxAgeMs: number,
): void {
  const opts = getSessionCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(name, value, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Math.floor(maxAgeMs / 1000),
    }),
  );
}

export function clearSessionCookie(
  resHeaders: Headers,
  reqHeaders: Headers,
  name: string,
): void {
  const opts = getSessionCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(name, "", {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: 0,
    }),
  );
}
