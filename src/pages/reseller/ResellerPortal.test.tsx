// Behavioral proof against the REAL page component (not a hook-only harness
// or an artificial test component): mounts the actual default-exported
// <ResellerPortal /> — the same component the app routes to — wired to a
// real trpc/react-query client and a fake `fetch` implementing the actual
// httpBatchLink wire protocol. Mirrors useReseller.test.tsx's network
// mocking, but exercises the real DashboardTab/LoginScreen/Toast UI.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../../server/router";
import ResellerPortal from "./ResellerPortal";

const trpc = createTRPCReact<AppRouter>();

const RESELLER = {
  id: 1,
  name: "Revendeur Test",
  contact: "revendeur@example.com",
  username: "revendeur-test",
  credits: 42,
  createdAt: new Date(0).toISOString(),
};

function procedurePaths(url: string): string[] {
  const pathname = new URL(url, "http://localhost").pathname;
  return pathname.replace("/api/trpc/", "").split(",");
}

function renderPortal(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient();
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "/api/trpc", transformer: superjson, fetch: fetchImpl })],
  });
  return render(
    <HelmetProvider>
      <trpc.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/revendeur"]}>
            <ResellerPortal />
          </MemoryRouter>
        </QueryClientProvider>
      </trpc.Provider>
    </HelmetProvider>
  );
}

function batchResponse(results: unknown[]) {
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("ResellerPortal (real component) — logout error handling", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a visible error toast and keeps the dashboard visible on a genuine logout failure (network/5xx)", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("reseller.me")) {
        return batchResponse([
          { result: { data: superjson.serialize(RESELLER) } },
        ]);
      }
      if (paths.includes("reseller.logout")) {
        return batchResponse([
          {
            error: {
              json: {
                message: "Base de données injoignable.",
                code: -32001,
                data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
              },
            },
          },
        ]);
      }
      throw new Error(`Unexpected request: ${paths.join(",")}`);
    });

    renderPortal(fetchImpl as unknown as typeof fetch);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Activer une licence" })
      ).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Base de données injoignable.");
    // A failed logout must never look like a successful one: the dashboard
    // stays on screen.
    expect(
      screen.getByRole("heading", { name: "Activer une licence" })
    ).toBeInTheDocument();
  });

  it("treats a 401 on logout (already revoked elsewhere) as already-logged-out, with no false error", async () => {
    let meCallCount = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("reseller.me")) {
        meCallCount++;
        if (meCallCount === 1) {
          return batchResponse([
            { result: { data: superjson.serialize(RESELLER) } },
          ]);
        }
        return batchResponse([
          {
            error: {
              json: {
                message: "Authentication required",
                code: -32001,
                data: { code: "UNAUTHORIZED", httpStatus: 401 },
              },
            },
          },
        ]);
      }
      if (paths.includes("reseller.logout")) {
        return batchResponse([
          {
            error: {
              json: {
                message: "Authentication required",
                code: -32001,
                data: { code: "UNAUTHORIZED", httpStatus: 401 },
              },
            },
          },
        ]);
      }
      throw new Error(`Unexpected request: ${paths.join(",")}`);
    });

    renderPortal(fetchImpl as unknown as typeof fetch);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Activer une licence" })
      ).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    // The real login screen is shown — same outcome as a successful logout —
    // and no technical error is ever surfaced to the user.
    await waitFor(() =>
      expect(screen.getByLabelText("Identifiant")).toBeInTheDocument()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
