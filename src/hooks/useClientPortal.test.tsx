// Behavioral proof, not just type-checking: mounts the real trpc React
// Query client wired to a fake `fetch` implementing tRPC's actual
// httpBatchLink wire format (superjson-encoded batch requests/responses),
// so this exercises the real cache mechanics — `utils.clientPortal.
// getDashboard.reset()` really does clear the query synchronously — not a
// mocked stand-in. Mirrors useAuth.test.tsx's harness for the client portal.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import { useClientPortal } from "./useClientPortal";

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

function TestHarness() {
  const { dashboard, isAuthenticated, isLoading, logout, logoutError } =
    useClientPortal();

  if (isLoading) return <div>Chargement…</div>;
  if (!isAuthenticated) return <div>Écran de connexion</div>;

  return (
    <div>
      <div>Tableau de bord ({dashboard?.name})</div>
      <button onClick={logout}>Se déconnecter</button>
      {logoutError && <div role="alert">{logoutError.message}</div>}
    </div>
  );
}

function renderHarness(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient();
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "/api/trpc", transformer: superjson, fetch: fetchImpl })],
  });
  return render(
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TestHarness />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function batchResponse(results: unknown[]) {
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("useClientPortal logout — behavioral proof (real cache, not mocked)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("hides the dashboard immediately on logout success, before any refetch resolves", async () => {
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
        // The automatic refetch triggered by reset() — deliberately delayed
        // so the test proves the dashboard disappears from reset() itself,
        // synchronously, not from waiting on this refetch.
        await new Promise(r => setTimeout(r, 200));
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
          { result: { data: superjson.serialize({ success: true }) } },
        ]);
      }
      throw new Error(`Unexpected request: ${paths.join(",")}`);
    });

    renderHarness(fetchImpl as unknown as typeof fetch);

    await waitFor(() =>
      expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument()
    );

    await userEvent.click(screen.getByText("Se déconnecter"));

    await waitFor(
      () => expect(screen.queryByText(/Tableau de bord/)).not.toBeInTheDocument(),
      { timeout: 150 }
    );
  });

  it("keeps the dashboard visible and shows an error on a genuine logout failure (network/5xx)", async () => {
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
                message: "Database unreachable",
                code: -32001,
                data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
              },
            },
          },
        ]);
      }
      throw new Error(`Unexpected request: ${paths.join(",")}`);
    });

    renderHarness(fetchImpl as unknown as typeof fetch);

    await waitFor(() =>
      expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument()
    );

    await userEvent.click(screen.getByText("Se déconnecter"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    // A failed logout must never look like a successful one.
    expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument();
  });

  it("treats a 401 on logout (already revoked elsewhere) as already-logged-out, not an error", async () => {
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

    renderHarness(fetchImpl as unknown as typeof fetch);

    await waitFor(() =>
      expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument()
    );

    await userEvent.click(screen.getByText("Se déconnecter"));

    await waitFor(() =>
      expect(screen.getByText("Écran de connexion")).toBeInTheDocument()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
