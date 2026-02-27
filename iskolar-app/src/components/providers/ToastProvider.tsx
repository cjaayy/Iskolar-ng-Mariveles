"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

/* ================================================================
   TOAST NOTIFICATION SYSTEM
   ================================================================ */

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-sage-500" />,
  error: <AlertCircle className="w-5 h-5 text-coral-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-ocean-400" />,
};

const toastColors: Record<ToastType, string> = {
  success: "border-l-sage-400 bg-sage-50 dark:bg-sage-500/10",
  error: "border-l-coral-400 bg-coral-50 dark:bg-coral-500/10",
  warning: "border-l-amber-400 bg-amber-50 dark:bg-amber-500/10",
  info: "border-l-ocean-400 bg-ocean-50 dark:bg-ocean-400/10",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              animate-toast-in border-l-4 rounded-lg p-4 shadow-soft
              flex items-start gap-3 bg-card-bg
              ${toastColors[toast.type]}
            `}
            role="alert"
          >
            <span className="flex-shrink-0 mt-0.5">{toastIcons[toast.type]}</span>
            <p className="text-sm font-body text-foreground flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-muted-fg hover:text-foreground transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
