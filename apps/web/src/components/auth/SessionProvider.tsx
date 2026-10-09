"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthUser, fetchSession, logout as apiLogout } from "@/lib/api";

interface SessionContextValue {
  /** Signed-in user, or null. */
  user: AuthUser | null;
  /** True until the initial /auth/me check resolves. */
  loading: boolean;
  /** Re-check the session (call after sign-in/up). */
  refresh: () => Promise<void>;
  /** Sign out and clear local state. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export const useSession = () => useContext(SessionContext);

/**
 * One /auth/me fetch for the whole app; the session itself lives in an
 * httpOnly cookie set by the API, so JavaScript never touches a token.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await fetchSession());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
