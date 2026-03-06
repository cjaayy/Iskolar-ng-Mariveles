/**
 * components/providers/SessionProvider.tsx
 *
 * Provides the current applicant session throughout the app.
 * Reads applicantId from localStorage (set at login).
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/** Read the logged-in applicant ID from localStorage */
export function getApplicantId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("applicantId");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export interface SessionUser {
  userId: number;
  applicantId: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  contactNumber: string | null;
  address: string | null;
  profileCompletion: number;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const applicantId = getApplicantId();
    if (!applicantId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/me", {
        headers: { "x-applicant-id": String(applicantId) },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("[Session] Failed to load user:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
