// Assembles the Vercel "Build Output API" directory (.vercel/output) by hand
// instead of relying on Vercel's zero-config / @vercel/node per-file
// transpile. Two reasons this exists:
//
//   1. Runtime: with "type":"module", @vercel/node transpiles each source
//      file separately and leaves extensionless relative imports (./app),
//      which Node's ESM loader cannot resolve → ERR_MODULE_NOT_FOUND at
//      runtime. esbuild bundles the whole Hono app into ONE self-contained
//      file, so there are no relative imports left to resolve.
//
//   2. Function count: the Hobby plan caps a deployment at 12 Serverless
//      Functions. Zero-config used to turn every file under /api into its own
//      function (14 > 12 → build fails). The server now lives in server/ (no
//      /api directory), and this script emits exactly one function.
//
// Layout produced:
//   .vercel/output/static/                  ← the Vite SPA (dist/public)
//   .vercel/output/functions/api/index.func ← the single bundled function
//   .vercel/output/config.json              ← routing (/api/* → function,
//                                             everything else → index.html)

import { build } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, ".vercel", "output");
const funcDir = path.join(outputDir, "functions", "api", "index.func");
const staticDir = path.join(outputDir, "static");

// Start from a clean output tree.
await rm(outputDir, { recursive: true, force: true });
await mkdir(funcDir, { recursive: true });

// 1. Static assets: `vite build` (run by the `vercel-build` npm script before
//    this file) writes the SPA to dist/public. Copy it into output/static.
await cp(path.join(root, "dist", "public"), staticDir, { recursive: true });

// 2. Bundle the Hono app (Web handler via hono/vercel) into one ESM file.
await build({
  entryPoints: [path.join(root, "server", "index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: path.join(funcDir, "index.mjs"),
  tsconfig: path.join(root, "tsconfig.json"),
  // Some transitive deps reference `require` even in ESM output; provide a
  // shim so the bundle stays self-contained.
  banner: {
    js: "import { createRequire as __cr } from 'module';const require = __cr(import.meta.url);",
  },
});

// 3. Function config: Node 20 runtime, ESM entry, no legacy helpers.
await writeFile(
  path.join(funcDir, ".vc-config.json"),
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

// The .func dir needs its own package.json so Node treats index.mjs as ESM.
await writeFile(
  path.join(funcDir, "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
);

// 4. Top-level routing: /api/* hits the function, filesystem assets are served
//    directly, and every other path falls back to the SPA shell.
await writeFile(
  path.join(outputDir, "config.json"),
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

console.log("✓ .vercel/output assembled (1 function: api/index.func)");
