const SENSITIVE_PUBLIC_PROCEDURES = new Set([
  "auth.adminLogin",
  "clientPortal.login",
  "reseller.login",
  "app.registerDevice",
]);

function asUrl(input: string | URL): URL {
  return input instanceof URL ? input : new URL(input, "http://localhost");
}

export function trpcProcedureNames(input: string | URL): string[] {
  const url = asUrl(input);
  const marker = "/api/trpc/";
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0) return [];

  const encodedPath = url.pathname.slice(markerIndex + marker.length);
  if (!encodedPath) return [];

  try {
    return decodeURIComponent(encodedPath)
      .split(",")
      .map(name => name.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function isSensitiveTrpcRequest(input: string | URL): boolean {
  return trpcProcedureNames(input).some(name =>
    SENSITIVE_PUBLIC_PROCEDURES.has(name)
  );
}

export function isSensitiveTrpcBatch(input: string | URL): boolean {
  const url = asUrl(input);
  if (!isSensitiveTrpcRequest(url)) return false;
  return (
    url.searchParams.get("batch") === "1" ||
    trpcProcedureNames(url).length !== 1
  );
}

// Browser mutations are same-origin. Native TV/box clients generally omit the
// Origin header and remain supported; browsers sending an Origin must match the
// effective Host (including the forwarded host on Vercel/proxies).
export function hasAllowedOrigin(
  headers: Headers,
  requestUrl: string | URL
): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;

  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const directHost = headers.get("host")?.split(",")[0]?.trim();
  const expectedHost = forwardedHost || directHost || asUrl(requestUrl).host;

  try {
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}

export function sensitiveProcedureKey(input: string | URL): string {
  return (
    trpcProcedureNames(input).find(name =>
      SENSITIVE_PUBLIC_PROCEDURES.has(name)
    ) ?? "unknown"
  );
}
