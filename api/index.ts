import { handle } from "hono/vercel";
import app from "./app";

// Vercel Serverless Function entry: the whole Hono app behind a single
// function. vercel.json rewrites every /api/* request here.
export default handle(app);
