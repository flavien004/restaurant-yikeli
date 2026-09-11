import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle, CheckCircle2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-orange-500 hover:bg-orange-600 text-white';

  const iconContainerClass = isDanger
    ? 'bg-rose-100 text-rose-600'
    : isWarning
    ? 'bg-amber-100 text-amber-600'
    : isSuccess
    ? 'bg-emerald-100 text-emerald-600'
    : 'bg-orange-100 text-orange-600';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/90 z-10 space-y-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconContainerClass}`}>
              {isDanger && <AlertTriangle className="w-6 h-6" />}
              {isWarning && <AlertTriangle className="w-6 h-6" />}
              {isSuccess && <CheckCircle2 className="w-6 h-6" />}
              {!isDanger && !isWarning && !isSuccess && <HelpCircle className="w-6 h-6" />}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer ${confirmBtnClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
