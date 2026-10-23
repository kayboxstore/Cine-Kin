import { describe, expect, it } from "vitest";
import { isKnownSpaRoute } from "./lib/vite";

describe("SPA route status", () => {
  it.each(["/", "/offres", "/login", "/admin", "/blog/1", "/blog/6/"])(
    "recognizes %s",
    route => {
      expect(isKnownSpaRoute(route)).toBe(true);
    }
  );

  it.each(["/inconnue", "/blog/7", "/blog/abc", "/admin/export"])(
    "rejects %s",
    route => {
      expect(isKnownSpaRoute(route)).toBe(false);
    }
  );
});
