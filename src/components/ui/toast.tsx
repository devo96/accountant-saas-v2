"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContext = {
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastContext>({ toast: () => {}, dismiss: () => {} });

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success" />,
  error: <AlertCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-info" />,
};

const borders: Record<ToastType, string> = {
  success: "border-s-4 border-success",
  error: "border-s-4 border-danger",
  warning: "border-s-4 border-warning",
  info: "border-s-4 border-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 animate-slide-up",
              borders[t.type]
            )}
          >
            <span className="mt-0.5 flex-shrink-0">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.title}</p>
              {t.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
