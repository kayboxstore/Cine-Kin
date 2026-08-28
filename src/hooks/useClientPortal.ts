import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

// Client-portal auth state, backed by the dedicated ck_client_sid session
// (MAC+PIN — distinct from admin OAuth and reseller sessions). There is no
// clientPortal.me endpoint, so getDashboard doubles as the auth probe: it
// returns the dashboard when the session is valid, or 401 otherwise.
export function useClientPortal() {
  const utils = trpc.useUtils();

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = trpc.clientPortal.getDashboard.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60,
  });

  const logoutMutation = trpc.clientPortal.logout.useMutation({
    onSuccess: () => {
      // Immediate, synchronous cache clear — see useAuth.ts for why this
      // replaces invalidate().
      utils.clientPortal.getDashboard.reset();
    },
    onError: error => {
      if (error.data?.code === "UNAUTHORIZED") {
        utils.clientPortal.getDashboard.reset();
      }
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const logoutError =
    logoutMutation.isError && logoutMutation.error.data?.code !== "UNAUTHORIZED"
      ? logoutMutation.error
      : null;

  return useMemo(
    () => ({
      dashboard: dashboard ?? null,
      isAuthenticated: !!dashboard,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      logoutError,
      refresh: refetch,
    }),
    [dashboard, isLoading, logoutMutation.isPending, error, logout, logoutError, refetch],
  );
}
