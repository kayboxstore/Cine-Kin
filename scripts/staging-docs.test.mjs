import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "./lib/migration-database.mjs";

async function projectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

describe("staging operational contract", () => {
  it("keeps the runnable commands and runbook aligned", async () => {
    const [packageSource, runbook, migrationRunbook, gitignore] =
      await Promise.all([
        projectFile("package.json"),
        projectFile("docs/staging-rehearsal-runbook.md"),
        projectFile("docs/database-migration-runbook.md"),
        projectFile(".gitignore"),
      ]);
    const packageJson = JSON.parse(packageSource);

    expect(packageJson.scripts).toMatchObject({
      "staging:preflight": "node scripts/staging-preflight.mjs",
      "staging:rehearse": "node scripts/staging-rehearsal.mjs",
      "staging:smoke": "node scripts/staging-smoke.mjs",
    });
    expect(runbook).toContain("STAGING_REHEARSAL_ALLOW_APPLY=1");
    expect(runbook).toContain("--confirm-source");
    expect(runbook).toContain("--confirm-restore");
    expect(runbook).toContain("aucun dump SQL en clair");
    expect(migrationRunbook).toContain(
      "Le build Vercel ne migre jamais la base."
    );
    expect(migrationRunbook).not.toContain(
      "migrée automatiquement pendant le build Vercel"
    );
    expect(gitignore).toContain("artifacts/staging-backups/");
  });
});
