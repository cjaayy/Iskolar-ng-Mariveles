/**
 * components/providers/SessionProvider.tsx
 *
 * Provides the current (demo) applicant session throughout the app.
 * Replace DEMO_APPLICANT_ID with real session logic when auth is added.
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// ─── Temporary: hardcoded demo applicant ID until auth is implemented ─────────
export const DEMO_APPLICANT_ID = 1;

export interface SessionUser {
  userId: number;
  applicantId: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  studentNumber: string;
  gpa: number;
  yearLevel: number;
  yearLevelLabel: string;
  course: string;
  college: string;
  monthlyIncome: number;
  householdSize: number;
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
    try {
      const res = await fetch("/api/me", {
        headers: { "x-applicant-id": String(DEMO_APPLICANT_ID) },
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
