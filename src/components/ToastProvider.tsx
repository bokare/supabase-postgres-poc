"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Toast = {
  id: number;
  title?: string;
  message: string;
  variant?: "success" | "error" | "info";
  durationMs?: number;
};

type ToastContextValue = {
  show: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    const toast: Toast = { id, durationMs: 3000, variant: "info", ...t };
    setToasts((prev) => [...prev, toast]);
    const duration = toast.durationMs ?? 3000;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto w-full max-w-sm rounded-md border p-3 shadow-xl backdrop-blur " +
              (t.variant === "success"
                ? "border-green-200 bg-green-50/90 text-green-900"
                : t.variant === "error"
                ? "border-red-200 bg-red-50/90 text-red-900"
                : "border-slate-200 bg-white/90 text-slate-900")
            }
            role="status"
            aria-live="polite"
          >
            {t.title && (
              <div className="mb-0.5 text-sm font-semibold">{t.title}</div>
            )}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

