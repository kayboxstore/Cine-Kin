import { authRouter } from "./auth-router";
import { adminRouter } from "./admin-router";
import { appDeviceRouter } from "./app-device-router";
import { clientRouter } from "./client-router";
import { resellerRouter } from "./reseller-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  admin: adminRouter,
  app: appDeviceRouter,
  // NOTE: mounted as `clientPortal` because tRPC reserves the top-level key
  // `client` (it collides with a built-in router method).
  clientPortal: clientRouter,
  reseller: resellerRouter,
});

export type AppRouter = typeof appRouter;
