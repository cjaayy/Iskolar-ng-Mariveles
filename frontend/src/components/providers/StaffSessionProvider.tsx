/**
 * components/providers/StaffSessionProvider.tsx
 *
 * Provides the current staff/validator session throughout the staff pages.
 * Reads from localStorage so the session persists across page loads.
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export interface StaffUser {
  userId: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface StaffSessionContextValue {
  user: StaffUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const StaffSessionContext = createContext<StaffSessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function StaffSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Read staff ID from localStorage (set during login)
      const staffId =
        typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

      if (!staffId) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/staff/me", {
        headers: { "x-validator-id": staffId },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Invalid session, clear
        localStorage.removeItem("staffId");
      }
    } catch (e) {
      console.error("[StaffSession] Failed to load user:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StaffSessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  return useContext(StaffSessionContext);
}
