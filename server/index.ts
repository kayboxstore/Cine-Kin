import { handle } from "hono/vercel";
import app from "./app";

// Vercel Serverless Function entry: the whole Hono app behind a single
// function. The Build Output API config (scripts/build-vercel.mjs) rewrites
// every /api/* request here.
export default handle(app);
