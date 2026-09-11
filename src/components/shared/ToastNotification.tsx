import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback safe implementation if outside provider
    return {
      showToast: (m: string) => console.log(m),
      success: (m: string) => console.log('[Success]', m),
      error: (m: string) => console.error('[Error]', m),
      warning: (m: string) => console.warn('[Warning]', m),
      info: (m: string) => console.info('[Info]', m),
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newToast: ToastItem = { id, message, type, title, duration };
      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, title?: string) => showToast(msg, 'success', title),
    [showToast]
  );
  const error = useCallback(
    (msg: string, title?: string) => showToast(msg, 'error', title, 5500),
    [showToast]
  );
  const warning = useCallback(
    (msg: string, title?: string) => showToast(msg, 'warning', title, 4500),
    [showToast]
  );
  const info = useCallback(
    (msg: string, title?: string) => showToast(msg, 'info', title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            const bgClass = isSuccess
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : isError
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : isWarning
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-slate-900 border-slate-800 text-white';

            const iconClass = isSuccess
              ? 'text-emerald-600'
              : isError
              ? 'text-rose-600'
              : isWarning
              ? 'text-amber-600'
              : 'text-sky-400';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.94 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`pointer-events-auto rounded-2xl p-4 border shadow-lg flex items-start gap-3 backdrop-blur-md ${bgClass}`}
              >
                <div className="shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />}
                  {isError && <AlertCircle className={`w-5 h-5 ${iconClass}`} />}
                  {isWarning && <AlertTriangle className={`w-5 h-5 ${iconClass}`} />}
                  {!isSuccess && !isError && !isWarning && <Info className={`w-5 h-5 ${iconClass}`} />}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  {toast.title && (
                    <div className="text-xs font-extrabold uppercase tracking-wide mb-0.5">
                      {toast.title}
                    </div>
                  )}
                  <p className="text-xs font-medium leading-relaxed break-words">{toast.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-gray-450 hover:text-gray-700 transition cursor-pointer p-0.5 rounded-lg"
                  aria-label="Fermer la notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
