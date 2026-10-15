import { test, expect, type Page } from "@playwright/test";

// Runs against the real built server (dist/boot.js) + a disposable local
// MySQL, with fictitious secrets only — never a real credential.
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "test-only-fake-admin-password";

// This sandbox's pre-installed Chromium revision does not apply
// `page.fill()` reliably to this controlled input (value silently stays
// empty); pressSequentially() dispatches real key events and works. Kept
// local to this helper rather than a global workaround.
async function loginAsAdmin(page: Page) {
  await page.goto("/admin");
  const passwordField = page.getByLabel("Mot de passe administrateur");
  await passwordField.click();
  await passwordField.pressSequentially(ADMIN_PASSWORD, { delay: 10 });
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
}

test.describe("admin logout — real browser", () => {
  test("dashboard disappears on logout and stays inaccessible after back/reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();

    await page.getByRole("button", { name: "Se déconnecter" }).click();

    // Login screen shown, dashboard gone.
    await expect(page.getByLabel("Mot de passe administrateur")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).not.toBeVisible();

    // The reported scenario: browser back button, then a full reload —
    // the dashboard must remain inaccessible either way, not just "until
    // the SPA router re-renders".
    await page.goBack();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).not.toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Mot de passe administrateur")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).not.toBeVisible();
  });

  test("a session cookie captured before logout cannot be replayed after logout", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    // Capture the cookie exactly as an attacker who copied it beforehand
    // would have it.
    const cookiesBeforeLogout = await context.cookies();
    const stolenAdminCookie = cookiesBeforeLogout.find(c => c.name === "ck_admin_sid");
    expect(stolenAdminCookie).toBeDefined();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page.getByLabel("Mot de passe administrateur")).toBeVisible();

    // Replay the captured cookie value directly against the API, bypassing
    // the browser entirely — this is exactly the reported vulnerability.
    const response = await page.request.get("/api/trpc/auth.me", {
      headers: { cookie: `ck_admin_sid=${stolenAdminCookie!.value}` },
    });
    expect(response.status()).toBe(401);
  });
});
