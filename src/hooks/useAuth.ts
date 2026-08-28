import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Synchronous, immediate cache clear — unlike invalidate(), this does
      // not wait for a background refetch, so the dashboard cannot remain
      // visible on stale cached data while a request is in flight. reset()
      // (not setData(undefined, ...)) also clears any lingering error/status
      // from a previous failed attempt.
      utils.auth.me.reset();
      navigate(redirectPath);
    },
    onError: error => {
      if (error.data?.code === "UNAUTHORIZED") {
        // The session was already revoked server-side (a second tab, a
        // repeated click, or logout from elsewhere) — this is not a
        // failure, it's the target state already reached. Treat it exactly
        // like success: no technical error shown to the user.
        utils.auth.me.reset();
        navigate(redirectPath);
        return;
      }
      // A genuine failure (network error, MySQL unreachable, HTTP 5xx): the
      // dashboard must stay visible and the error must be explicit — never
      // silently treated as "logged out" when the server could not confirm
      // the session was actually revoked.
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  // Only a genuine logout failure (network/5xx) surfaces here — an
  // UNAUTHORIZED response is handled above as "already logged out" and
  // never reaches this.
  const logoutError =
    logoutMutation.isError && logoutMutation.error.data?.code !== "UNAUTHORIZED"
      ? logoutMutation.error
      : null;

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      logoutError,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, logoutError, refetch],
  );
}
