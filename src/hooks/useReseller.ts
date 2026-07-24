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
    onSuccess: async () => {
      await utils.invalidate();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      reseller: reseller ?? null,
      isAuthenticated: !!reseller,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [reseller, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
