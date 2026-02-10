import { useState } from 'react';
import { AlertTriangle, Info, Snowflake, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'low-stock' | 'expiring' | 'suggestion';
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const STYLES: Record<AlertBannerProps['type'], { bg: string; border: string; icon: string; text: string }> = {
  'low-stock': { bg: 'bg-ramen/10', border: 'border-ramen/30', icon: 'text-ramen', text: 'text-ramen' },
  'expiring': { bg: 'bg-ramen/10', border: 'border-ramen/30', icon: 'text-ramen', text: 'text-ramen' },
  'suggestion': { bg: 'bg-frost/10', border: 'border-frost/30', icon: 'text-frost', text: 'text-frost' },
};

const ICONS: Record<AlertBannerProps['type'], React.ReactNode> = {
  'low-stock': <Snowflake className="w-4 h-4" />,
  'expiring': <AlertTriangle className="w-4 h-4" />,
  'suggestion': <Info className="w-4 h-4" />,
};

export function AlertBanner({ type, message, className = '', onDismiss }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const style = STYLES[type];

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-button border ${style.bg} ${style.border} ${className}`}>
      <div className="flex items-center gap-2">
        <span className={style.icon}>{ICONS[type]}</span>
        <span className={`text-xs font-body ${style.text}`}>{message}</span>
      </div>
      <button onClick={handleDismiss} className="text-text-ghost hover:text-text-mid transition-colors p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
