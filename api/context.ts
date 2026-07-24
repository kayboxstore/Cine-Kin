import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import type { User, AppClient, Reseller } from "@db/schema";
import { appClients, resellers } from "@db/schema";
import { ClientSession, ResellerSession } from "@contracts/constants";
import { authenticateRequest } from "./kimi/auth";
import { verifyClientSession, verifyResellerSession } from "./lib/app-sessions";
import { getDb } from "./queries/connection";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  appClient?: AppClient;
  reseller?: Reseller;
};

async function loadAppClient(appClientId: number): Promise<AppClient | undefined> {
  const rows = await getDb()
    .select()
    .from(appClients)
    .where(eq(appClients.id, appClientId))
    .limit(1);
  return rows.at(0);
}

async function loadReseller(resellerId: number): Promise<Reseller | undefined> {
  const rows = await getDb()
    .select()
    .from(resellers)
    .where(eq(resellers.id, resellerId))
    .limit(1);
  return rows.at(0);
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Admin (Kimi) session — optional.
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
  }

  // Application-licence sessions — parsed only when their cookie is present.
  const cookies = cookie.parse(opts.req.headers.get("cookie") || "");

  const clientToken = cookies[ClientSession.cookieName];
  if (clientToken) {
    try {
      const claim = await verifyClientSession(clientToken);
      if (claim) ctx.appClient = await loadAppClient(claim.appClientId);
    } catch {
      // Optional
    }
  }

  const resellerToken = cookies[ResellerSession.cookieName];
  if (resellerToken) {
    try {
      const claim = await verifyResellerSession(resellerToken);
      if (claim) ctx.reseller = await loadReseller(claim.resellerId);
    } catch {
      // Optional
    }
  }

  return ctx;
}
