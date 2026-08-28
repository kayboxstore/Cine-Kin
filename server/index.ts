import { handle } from "hono/vercel";
import app from "./app";

// Vercel Serverless Function entry: the whole Hono app behind a single
// function. The Build Output API config (scripts/build-vercel.mjs) rewrites
// every /api/* request here.
//
// Exported as `fetch`, not `default`: our .vc-config.json declares the
// classic Node.js launcher (launcherType: "Nodejs"), which expects a
// `(req, res) => void` default export that writes the response through
// `res`. `handle(app)` instead returns a Web Fetch-style function
// `(req: Request) => Promise<Response>` — with only a `default` export, the
// launcher calls it, gets back a `Response` it doesn't know what to do
// with, logs a warning, and never writes anything to `res`. The request
// then hangs until Vercel force-kills it at the platform's max duration.
// A named `fetch` export is the signature Vercel's Node.js runtime
// recognizes for Web-standard handlers, so it invokes it correctly instead.
export const fetch = handle(app);
