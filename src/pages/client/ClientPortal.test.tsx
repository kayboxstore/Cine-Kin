// Behavioral proof against the REAL page component (not a hook-only harness
// or an artificial test component): mounts the actual default-exported
// <ClientPortal /> — the same component the app routes to — wired to a real
// trpc/react-query client and a fake `fetch` implementing the actual
// httpBatchLink wire protocol. Mirrors useClientPortal.test.tsx's network
// mocking, but exercises the real DashboardView/ClientLogin/Toast UI.
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
import ClientPortal from "./ClientPortal";

const trpc = createTRPCReact<AppRouter>();

const DASHBOARD = {
  mac: "AA:BB:CC:DD:EE:FF",
  name: "Salon",
  email: "client@example.com",
  licenseType: "annual" as const,
  status: "active" as const,
  activatedAt: new Date(0).toISOString(),
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  parentalControlEnabled: false,
  playlistCount: 2,
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
          <MemoryRouter initialEntries={["/espace-client"]}>
            <ClientPortal />
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

describe("ClientPortal (real component) — logout error handling", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a visible error toast and keeps the dashboard visible on a genuine logout failure (network/5xx)", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("clientPortal.getDashboard")) {
        return batchResponse([
          { result: { data: superjson.serialize(DASHBOARD) } },
        ]);
      }
      if (paths.includes("clientPortal.logout")) {
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

    await waitFor(() => expect(screen.getByText(DASHBOARD.mac)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Base de données injoignable.");
    // A failed logout must never look like a successful one: the dashboard
    // stays on screen.
    expect(screen.getByText(DASHBOARD.mac)).toBeInTheDocument();
  });

  it("treats a 401 on logout (already revoked elsewhere) as already-logged-out, with no false error", async () => {
    let dashboardCallCount = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("clientPortal.getDashboard")) {
        dashboardCallCount++;
        if (dashboardCallCount === 1) {
          return batchResponse([
            { result: { data: superjson.serialize(DASHBOARD) } },
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
      if (paths.includes("clientPortal.logout")) {
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

    await waitFor(() => expect(screen.getByText(DASHBOARD.mac)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    // The real login screen is shown — same outcome as a successful logout —
    // and no technical error is ever surfaced to the user.
    await waitFor(() =>
      expect(screen.getByLabelText("Adresse MAC")).toBeInTheDocument()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
