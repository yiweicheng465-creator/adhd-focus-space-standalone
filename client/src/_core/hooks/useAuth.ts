/**
 * Stub auth hook — always returns unauthenticated.
 * All data is stored in localStorage (no server required).
 */
export function useAuth(_options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }) {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => {},
    logout: async () => {},
  };
}
