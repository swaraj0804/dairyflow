import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Milk, ReceiptText, Sparkles, WifiOff, Cloud } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  iconType?: 'check' | 'milk' | 'expense' | 'sync' | 'offline';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 3800;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const renderIcon = () => {
    if (toast.iconType === 'milk') {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
          <Milk size={20} className="stroke-[2.2]" />
        </div>
      );
    }
    if (toast.iconType === 'expense') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
          <ReceiptText size={20} className="stroke-[2.2]" />
        </div>
      );
    }
    if (toast.iconType === 'offline') {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
          <WifiOff size={20} className="stroke-[2.2]" />
        </div>
      );
    }

    switch (toast.type) {
      case 'error':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-sm">
            <AlertCircle size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
            <AlertCircle size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'info':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
            <Info size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'success':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
            <CheckCircle2 size={20} className="stroke-[2.5]" />
          </div>
        );
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'error':
        return 'border-red-200 bg-white';
      case 'warning':
        return 'border-amber-200 bg-white';
      case 'info':
        return 'border-blue-200 bg-white';
      case 'success':
      default:
        return 'border-emerald-200/80 bg-white';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-blue-500';
      case 'success':
      default:
        return 'bg-brand-600';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`pointer-events-auto w-full max-w-sm rounded-[20px] p-3.5 shadow-xl shadow-brand-900/10 border relative overflow-hidden flex flex-col gap-2 backdrop-blur-md ${getBorderColor()}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {renderIcon()}

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-brand-900 leading-tight tracking-tight">
              {toast.title}
            </h4>
          </div>
          {toast.message && (
            <p className="text-xs text-brand-900/75 font-medium mt-1 leading-snug wrap-break-word">
              {toast.message}
            </p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-lg transition"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-brand-900/40 hover:text-brand-900 hover:bg-cream-100 rounded-lg p-1 transition-colors -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Auto-dismiss countdown bar */}
      {duration > 0 && (
        <div className="w-full bg-cream-100/80 h-1 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full transition-all ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed top-4 inset-x-0 z-100 px-4 pointer-events-none flex flex-col items-center gap-2.5 max-w-md mx-auto"
      aria-label="Notifications container"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
