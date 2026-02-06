import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { ChefModeSettings } from '../../data/schema';
import { ChefHat } from 'lucide-react';

const DEFAULT_SETTINGS: ChefModeSettings = {
  id: 'default',
  enabled: false,
  showPrepBlock: true,
  showParallelCooking: true,
  defaultPrepTime: 60,
};

export function ChefModeToggle() {
  const [settings, setSettings] = useState<ChefModeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const saved = await db.table('chefSettings').get('default');
      if (saved) {
        setSettings(saved);
      } else {
        // Создать настройки по умолчанию
        await db.table('chefSettings').put(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load chef mode settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleChefMode() {
    const newSettings: ChefModeSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    setSettings(newSettings);
    await db.table('chefSettings').put(newSettings);
  }

  if (loading) {
    return null;
  }

  return (
    <button
      onClick={toggleChefMode}
      className={`flex items-center gap-2 px-4 py-2 rounded-button font-heading font-semibold text-sm transition-all ${
        settings.enabled
          ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
          : 'bg-rift border border-nebula text-text-mid hover:bg-nebula'
      }`}
      title={settings.enabled ? 'Обычный режим' : 'Режим повара'}
    >
      <ChefHat className={`w-4 h-4 ${settings.enabled ? 'text-void' : 'text-text-mid'}`} />
      <span>{settings.enabled ? 'Режим повара' : 'Обычный режим'}</span>
    </button>
  );
}
