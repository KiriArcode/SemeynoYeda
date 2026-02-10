import { ChefHat } from 'lucide-react';
import { useChefMode } from '../../contexts/ChefModeContext';
import { logger } from '../../lib/logger';

export function ChefModeToggle() {
  const { enabled, toggle, loading } = useChefMode();

  if (loading) {
    return null;
  }

  return (
    <button
      onClick={() => {
        logger.log('[ChefModeToggle] Clicked, current state:', enabled);
        toggle();
      }}
      type="button"
      className={`flex items-center px-3 py-1.5 rounded-button font-heading font-semibold text-xs transition-all cursor-pointer select-none ${
        enabled
          ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
          : 'bg-rift border border-nebula text-text-mid hover:bg-nebula hover:border-portal/30'
      }`}
      style={{ gap: '6px' }}
      title={enabled ? 'Выключить режим повара' : 'Включить режим повара'}
    >
      <ChefHat className={`w-4 h-4 ${enabled ? 'text-void' : 'text-portal'}`} />
      <span>{enabled ? '👨‍🍳 Повар ON' : 'Режим повара'}</span>
    </button>
  );
}
