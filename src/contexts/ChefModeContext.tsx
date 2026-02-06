import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/db';
import type { ChefModeSettings } from '../data/schema';

interface ChefModeContextType {
  enabled: boolean;
  settings: ChefModeSettings | null;
  toggle: () => Promise<void>;
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

    const handleStorageChange = () => {
      loadSettings();
    };
    window.addEventListener('chefModeChanged', handleStorageChange);
    return () => {
      window.removeEventListener('chefModeChanged', handleStorageChange);
    };
  }, []);

  async function loadSettings() {
    try {
      const saved = await db.table('chefSettings').get('default');
      if (saved) {
        setSettings(saved);
      } else {
        await db.table('chefSettings').put(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load chef mode settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const currentSettings = settings || DEFAULT_SETTINGS;
    const newSettings: ChefModeSettings = {
      ...currentSettings,
      enabled: !currentSettings.enabled,
    };

    // Optimistic update — instant UI response
    setSettings(newSettings);

    try {
      await db.table('chefSettings').put(newSettings);
      window.dispatchEvent(new CustomEvent('chefModeChanged'));
    } catch (error) {
      console.error('Failed to toggle chef mode:', error);
      // Revert on failure
      setSettings(currentSettings);
    }
  }

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
