import { hashSecret } from "./crypto";
import {
  claimCodeExpiry,
  generateClaimCode,
  normalizeClaimCode,
} from "./app-license";

export function createClaimCredential(now = new Date()) {
  const claimCode = generateClaimCode();
  const claimCodeExpiresAt = claimCodeExpiry(now);
  return {
    claimCode,
    claimCodeHash: hashSecret(normalizeClaimCode(claimCode)),
    claimCodeExpiresAt,
  };
}
