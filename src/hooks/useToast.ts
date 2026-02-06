import { useState, useCallback } from 'react';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  type: ToastType;
  message: string;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    setToast({ type, message, isVisible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast((prev) => prev ? { ...prev, isVisible: false } : null);
        setTimeout(() => setToast(null), 300); // Ждём завершения анимации
      }, duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => prev ? { ...prev, isVisible: false } : null);
    setTimeout(() => setToast(null), 300);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
