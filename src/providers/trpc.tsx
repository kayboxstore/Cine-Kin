import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import type { ReactNode } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

const SENSITIVE_PUBLIC_PROCEDURES = new Set([
  "auth.adminLogin",
  "clientPortal.login",
  "reseller.login",
  "app.registerDevice",
]);

function credentialedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
}

const transportOptions = {
  url: "/api/trpc",
  transformer: superjson,
  fetch: credentialedFetch,
};

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: operation => SENSITIVE_PUBLIC_PROCEDURES.has(operation.path),
      true: httpLink(transportOptions),
      false: httpBatchLink(transportOptions),
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
