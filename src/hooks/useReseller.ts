import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

// Reseller auth state, backed by the dedicated ck_reseller_sid session cookie
// (distinct from the admin OAuth and the client MAC+PIN sessions).
export function useReseller() {
  const utils = trpc.useUtils();

  const {
    data: reseller,
    isLoading,
    error,
    refetch,
  } = trpc.reseller.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.reseller.logout.useMutation({
    onSuccess: () => {
      // Immediate, synchronous cache clear — see useAuth.ts for why this
      // replaces invalidate() (which only schedules a background refetch
      // and can leave stale authenticated data visible in the meantime).
      utils.reseller.me.reset();
    },
    onError: error => {
      if (error.data?.code === "UNAUTHORIZED") {
        // Already logged out elsewhere (second tab, repeated click) — treat
        // as the target state reached, not a failure.
        utils.reseller.me.reset();
      }
      // Otherwise: genuine failure, dashboard stays, error surfaces below.
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const logoutError =
    logoutMutation.isError && logoutMutation.error.data?.code !== "UNAUTHORIZED"
      ? logoutMutation.error
      : null;

  return useMemo(
    () => ({
      reseller: reseller ?? null,
      isAuthenticated: !!reseller,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      logoutError,
      refresh: refetch,
    }),
    [reseller, isLoading, logoutMutation.isPending, error, logout, logoutError, refetch],
  );
}
