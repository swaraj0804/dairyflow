import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastItem, ToastType } from '../components/Toast';

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  showSuccess: (title: string, message?: string, options?: Partial<ToastItem>) => string;
  showError: (title: string, message?: string, options?: Partial<ToastItem>) => string;
  showInfo: (title: string, message?: string, options?: Partial<ToastItem>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio subtle chime for success feedback
function playSuccessTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio note: 587Hz (D5) -> 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 400);
  } catch {
    // Audio tone failure is non-blocking
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? 3800
    };

    if (toast.type === 'success' || !toast.type) {
      playSuccessTone();
    }

    setToasts((prev) => [newToast, ...prev.slice(0, 2)]); // Keep maximum 3 toasts
    return id;
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string, options?: Partial<ToastItem>): string => {
      return showToast({
        type: 'success',
        title,
        message,
        iconType: options?.iconType ?? 'check',
        ...options
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string, options?: Partial<ToastItem>): string => {
      return showToast({
        type: 'error',
        title,
        message,
        ...options
      });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, options?: Partial<ToastItem>): string => {
      return showToast({
        type: 'info',
        title,
        message,
        ...options
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        hideToast,
        clearAllToasts
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
