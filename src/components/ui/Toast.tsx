import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle2; borderColor: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    borderColor: 'border-portal',
    iconColor: 'text-portal',
  },
  error: {
    icon: XCircle,
    borderColor: 'border-ramen',
    iconColor: 'text-ramen',
  },
  info: {
    icon: Info,
    borderColor: 'border-nebula',
    iconColor: 'text-text-dim',
  },
};

export function Toast({ type, message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`bg-rift ${config.borderColor} border rounded-card shadow-elevate px-4 py-3 min-w-[300px] flex items-center gap-3`}
      >
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        <p className="text-text-light font-body text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-light transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
