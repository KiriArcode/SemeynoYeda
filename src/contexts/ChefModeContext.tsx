import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db } from '../lib/db';
import type { ChefModeSettings } from '../data/schema';

interface ChefModeContextType {
  enabled: boolean;
  settings: ChefModeSettings;
  toggle: () => void;
  loading: boolean;
}

const ChefModeContext = createContext<ChefModeContextType | undefined>(undefined);

const DEFAULT_SETTINGS: ChefModeSettings = {
  id: 'default',
  enabled: false,
  showPrepBlock: true,
  showParallelCooking: true,
  defaultPrepTime: 60,
};

export function ChefModeProvider({ children }: { children: ReactNode }) {
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
        await db.table('chefSettings').put(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('ChefMode: Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  }

  // Синхронный optimistic toggle — мгновенная реакция UI
  const toggle = useCallback(() => {
    console.log('[ChefModeContext] toggle() called');
    setSettings((prev) => {
      const newSettings: ChefModeSettings = {
        ...prev,
        enabled: !prev.enabled,
      };
      console.log('[ChefModeContext] Toggling:', prev.enabled, '->', newSettings.enabled);

      // Запись в БД в фоне (не блокирует UI)
      db.table('chefSettings').put(newSettings).catch((error) => {
        console.error('ChefMode: Failed to persist toggle', error);
        // Откат при ошибке записи
        setSettings(prev);
      });

      return newSettings;
    });
  }, []);

  return (
    <ChefModeContext.Provider
      value={{
        enabled: settings.enabled,
        settings,
        toggle,
        loading,
      }}
    >
      {children}
    </ChefModeContext.Provider>
  );
}

export function useChefMode() {
  const context = useContext(ChefModeContext);
  if (context === undefined) {
    throw new Error('useChefMode must be used within ChefModeProvider');
  }
  return context;
}
