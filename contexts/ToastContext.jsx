"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext({
  show: (_msg, _opts) => {},
  success: (_msg) => {},
  error: (_msg) => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const toast = {
      id,
      message: typeof message === "string" ? message : message?.toString?.() ?? "",
      variant: opts.variant || "default",
      duration: opts.duration ?? 3000,
    };
    setToasts((t) => [...t, toast]);
    // auto-dismiss
    setTimeout(() => remove(id), toast.duration);
    return id;
  }, [remove]);

  const success = useCallback((msg, duration) => show(msg, { variant: "success", duration }), [show]);
  const error = useCallback((msg, duration) => show(msg, { variant: "error", duration }), [show]);

  const value = useMemo(() => ({ show, success, error }), [show, success, error]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `min-w-[260px] max-w-[360px] rounded-lg border px-4 py-3 shadow-md text-sm ` +
              (t.variant === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                : t.variant === "error"
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                : "bg-card border-border text-foreground")
            }
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
