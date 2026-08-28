// Behavioral proof, not just type-checking: mounts the real trpc React
// Query client wired to a fake `fetch` implementing tRPC's actual
// httpBatchLink wire format (superjson-encoded batch requests/responses),
// so this exercises the real cache mechanics — `utils.auth.me.reset()`
// really does clear the query synchronously — not a mocked stand-in.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import { useAuth } from "./useAuth";

const trpc = createTRPCReact<AppRouter>();

type AdminUser = {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
  lastSignInAt: string;
};

const ADMIN_USER: AdminUser = {
  id: 0,
  unionId: "password-admin",
  name: "Administrateur",
  email: null,
  avatar: null,
  role: "admin",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  lastSignInAt: new Date(0).toISOString(),
};

// Extracts the batched procedure paths from a tRPC httpBatchLink request URL
// (e.g. "/api/trpc/auth.me,auth.logout?batch=1&...").
function procedurePaths(url: string): string[] {
  const pathname = new URL(url, "http://localhost").pathname;
  return pathname.replace("/api/trpc/", "").split(",");
}

function TestHarness({ redirectPath }: { redirectPath: string }) {
  const { user, isAuthenticated, isLoading, logout, logoutError } = useAuth({
    redirectPath,
  });

  if (isLoading) return <div>Chargement…</div>;
  if (!isAuthenticated) return <div>Écran de connexion</div>;

  return (
    <div>
      <div>Tableau de bord ({user?.name})</div>
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
        <MemoryRouter initialEntries={["/admin"]}>
          <TestHarness redirectPath="/admin" />
        </MemoryRouter>
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

describe("useAuth logout — behavioral proof (real cache, not mocked)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("hides the dashboard immediately on logout success, before any refetch resolves", async () => {
    let meCallCount = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("auth.me")) {
        meCallCount++;
        if (meCallCount === 1) {
          return batchResponse([
            { result: { data: superjson.serialize(ADMIN_USER) } },
          ]);
        }
        // react-query's reset() refetches active queries automatically —
        // this second call is that automatic refetch (matching production:
        // by the time it runs, the server has already cleared/revoked the
        // session, so it would legitimately return unauthenticated). It is
        // deliberately delayed here so the test can observe the window
        // *before* it resolves — proving the dashboard disappears from
        // reset() itself, synchronously, not from waiting on this refetch.
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
      if (paths.includes("auth.logout")) {
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

    // Within this window the automatic refetch (200ms delay) has NOT
    // resolved yet — if the dashboard is already gone, that proves reset()
    // cleared the cache synchronously, independent of the network round
    // trip. A stale-data implementation would still show the dashboard here.
    await waitFor(
      () => expect(screen.queryByText(/Tableau de bord/)).not.toBeInTheDocument(),
      { timeout: 150 }
    );
  });

  it("keeps the dashboard visible and shows an error on a genuine logout failure (network/5xx)", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("auth.me")) {
        return batchResponse([
          { result: { data: superjson.serialize(ADMIN_USER) } },
        ]);
      }
      if (paths.includes("auth.logout")) {
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
    // The dashboard must NOT disappear on a genuine failure — a failed
    // logout must never look like a successful one.
    expect(screen.getByText(/Tableau de bord/)).toBeInTheDocument();
  });

  it("treats a 401 on logout (already revoked elsewhere) as already-logged-out, not an error", async () => {
    let meCallCount = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const paths = procedurePaths(input.toString());
      if (paths.includes("auth.me")) {
        meCallCount++;
        if (meCallCount === 1) {
          return batchResponse([
            { result: { data: superjson.serialize(ADMIN_USER) } },
          ]);
        }
        // The automatic refetch triggered by reset(): the session really is
        // gone by now, so the server legitimately answers unauthenticated.
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
      if (paths.includes("auth.logout")) {
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

    // Same outcome as a successful logout: login screen shown, no error.
    await waitFor(() =>
      expect(screen.getByText("Écran de connexion")).toBeInTheDocument()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
