// Build Output API assembler for Vercel.
//
// Vercel's zero-config @vercel/node transpiles each api/*.ts file separately
// and, in an ESM ("type":"module") project, leaves extensionless relative
// imports that Node cannot resolve at runtime (ERR_MODULE_NOT_FOUND on ./app).
// We sidestep that entirely: esbuild bundles the whole Hono app into ONE
// self-contained function file (no relative imports left), and we hand Vercel
// a ready-made .vercel/output tree.
//
// Run after `vite build` (which emits the SPA into dist/public).

import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const OUT = ".vercel/output";
const FUNC = `${OUT}/functions/api/index.func`;

rmSync(OUT, { recursive: true, force: true });

// 1. Static SPA — copy the Vite output into the Build Output static dir.
mkdirSync(`${OUT}/static`, { recursive: true });
cpSync("dist/public", `${OUT}/static`, { recursive: true });

// 2. Serverless function — bundle api/index.ts (the hono/vercel Web handler)
//    into a single file. tsconfig.json provides the @db / @contracts aliases.
mkdirSync(FUNC, { recursive: true });
await build({
  entryPoints: ["api/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: `${FUNC}/index.mjs`,
  tsconfig: "tsconfig.json",
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});

writeFileSync(
  `${FUNC}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
    },
    null,
    2,
  ),
);

writeFileSync(
  `${FUNC}/package.json`,
  JSON.stringify({ type: "module" }, null, 2),
);

// 3. Routing — /api/* to the function, static files, SPA fallback.
writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api/(.*)$", dest: "/api/index" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("✓ .vercel/output assembled (static + single API function)");
