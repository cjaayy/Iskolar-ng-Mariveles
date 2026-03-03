/**
 * components/providers/AdminSessionProvider.tsx
 *
 * Provides the current admin session throughout admin pages.
 * Reads adminId from localStorage so the session persists across page loads.
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export interface AdminUser {
  userId: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminSessionContextValue {
  user: AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const adminId =
        typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

      if (!adminId) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/me", {
        headers: { "x-admin-id": adminId },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("adminId");
      }
    } catch (e) {
      console.error("[AdminSession] Failed to load user:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminSessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
