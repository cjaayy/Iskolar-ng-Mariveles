"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export interface EncoderUser {
  userId: string | number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  assignedSchool: string | null;
  assignedSchoolLevel?: string | null;
}

interface EncoderSessionContextValue {
  user: EncoderUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EncoderSessionContext = createContext<EncoderSessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function EncoderSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<EncoderUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const encoderId =
        typeof window !== "undefined"
          ? localStorage.getItem("encoderId")
          : null;

      const trimmed = encoderId?.trim() || "";
      const numeric = Number(trimmed);
      const isNumeric = Number.isFinite(numeric);
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(trimmed);
      if (
        !trimmed ||
        trimmed === "undefined" ||
        trimmed === "null" ||
        (!isNumeric && !isUuid)
      ) {
        if (encoderId) {
          localStorage.removeItem("encoderId");
        }
        setLoading(false);
        return;
      }

      const res = await fetch("/api/encoder/me", {
        headers: { "x-encoder-id": trimmed },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("encoderId");
      }
    } catch (e) {
      console.error("[EncoderSession] Failed to load user:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <EncoderSessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </EncoderSessionContext.Provider>
  );
}

export function useEncoderSession() {
  return useContext(EncoderSessionContext);
}
