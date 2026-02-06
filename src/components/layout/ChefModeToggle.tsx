import { ChefHat } from 'lucide-react';
import { useChefMode } from '../../contexts/ChefModeContext';

export function ChefModeToggle() {
  const { enabled, toggle, loading } = useChefMode();

  if (loading) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-button font-heading font-semibold text-sm transition-all ${
        enabled
          ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
          : 'bg-rift border border-nebula text-text-mid hover:bg-nebula'
      }`}
      title={enabled ? 'Обычный режим' : 'Режим повара'}
    >
      <ChefHat className={`w-4 h-4 ${enabled ? 'text-void' : 'text-text-mid'}`} />
      <span>{enabled ? 'Режим повара' : 'Обычный режим'}</span>
    </button>
  );
}
