import { isIP } from "node:net";

function validIp(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/^\[|\]$/g, "");
  return normalized && isIP(normalized) ? normalized : null;
}

export function getTrustedClientIp(options: {
  forwardedFor?: string;
  remoteAddress?: string;
  trustProxy: boolean;
  trustedHops: number;
}): string {
  if (options.trustProxy && options.forwardedFor) {
    const chain = options.forwardedFor
      .split(",")
      .map(value => validIp(value))
      .filter((value): value is string => value !== null);
    const candidate = chain.at(-options.trustedHops);
    if (candidate) return candidate;
  }

  return validIp(options.remoteAddress) ?? "unknown";
}
