import { ChefHat } from 'lucide-react';
import { useChefMode } from '../../contexts/ChefModeContext';

export function ChefModeToggle() {
  const { enabled, toggle, loading } = useChefMode();

  if (loading) {
    return null;
  }

  return (
    <button
      onClick={() => { toggle(); }}
      type="button"
      className={`flex items-center gap-2 px-4 py-2 rounded-button font-heading font-semibold text-sm transition-all cursor-pointer select-none ${
        enabled
          ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow animate-portal-pulse'
          : 'bg-rift border border-nebula text-text-mid hover:bg-nebula hover:border-portal/30'
      }`}
      title={enabled ? 'Выключить режим повара' : 'Включить режим повара'}
    >
      <ChefHat className={`w-4 h-4 ${enabled ? 'text-void' : 'text-portal'}`} />
      <span>{enabled ? 'Повар ON' : 'Режим повара'}</span>
    </button>
  );
}
