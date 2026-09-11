import devServer from "@hono/vite-dev-server";
import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";
import {
  publicMetadataPlugin,
  resolvePublicSiteOrigin,
} from "./scripts/lib/public-metadata";

const publicOutputDirectory = path.resolve(__dirname, "dist/public");

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const buildPlugins =
    command === "build"
      ? [
          publicMetadataPlugin({
            outputDirectory: publicOutputDirectory,
            siteOrigin: resolvePublicSiteOrigin(
              loadEnv(mode, __dirname, "VITE_").VITE_SITE_URL
            ),
          }),
        ]
      : [];

  return {
    plugins: [
      ...(command === "serve"
        ? [
            devServer({
              entry: "server/app.ts",
              exclude: [/^\/(?!api\/).*$/],
            }),
            inspectAttr(),
          ]
        : []),
      react(),
      ...buildPlugins,
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@contracts": path.resolve(__dirname, "./contracts"),
        "@db": path.resolve(__dirname, "./db"),
        db: path.resolve(__dirname, "./db"),
      },
    },
    envDir: path.resolve(__dirname),
    build: {
      outDir: publicOutputDirectory,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-core": [
              "react",
              "react-dom",
              "react-router",
              "react-router-dom",
              "react-helmet-async",
            ],
            motion: ["framer-motion"],
            "data-client": [
              "@tanstack/react-query",
              "@trpc/client",
              "@trpc/react-query",
              "superjson",
            ],
          },
        },
      },
    },
  };
});
