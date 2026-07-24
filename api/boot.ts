import { serve } from "@hono/node-server";
import app from "./app";
import { serveStaticFiles } from "./lib/vite";

// Persistent Node host entry (npm start → node dist/boot.js). On serverless
// platforms (Vercel) the app is served through api/index.ts instead, and this
// file is never executed.
serveStaticFiles(app);

const port = parseInt(process.env.PORT || "3000");
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}/`);
});

export default app;
