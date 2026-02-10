import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { ChefModeSettings } from '../data/schema';
import { ChefHat, Settings } from 'lucide-react';
import { useChefMode } from '../contexts/ChefModeContext';

const DEFAULT_SETTINGS: ChefModeSettings = {
  id: 'default',
  enabled: false,
  showPrepBlock: true,
  showParallelCooking: true,
  defaultPrepTime: 60,
  kolyaMealsMode: '4',
};

export function ChefSettingsPage() {
  const { settings: contextSettings, loading: contextLoading } = useChefMode();
  const [settings, setSettings] = useState<ChefModeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
      setLoading(false);
    } else if (!contextLoading) {
      loadSettings();
    }
  }, [contextSettings, contextLoading]);

  async function loadSettings() {
    try {
      const saved = await dataService.chefSettings.get('default').catch(() => null);
      if (saved) {
        setSettings(saved);
      } else {
        await dataService.chefSettings.save(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      logger.error('Failed to load chef settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(updates: Partial<ChefModeSettings>) {
    const newSettings: ChefModeSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      await dataService.chefSettings.save(newSettings);
    } catch (error) {
      logger.error('Failed to update chef settings:', error);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-portal" />
          <h1 className="font-heading text-2xl font-bold text-text-light">
            Настройки режима повара
          </h1>
        </div>
        <p className="text-text-mid font-body">
          Настройте параметры режима повара для удобной готовки
        </p>
      </div>

      <div className="space-y-4">
        {/* Переключатель режима повара */}
        <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-5 h-5 text-portal" />
              <div>
                <h3 className="font-heading font-semibold text-text-light">
                  Режим повара
                </h3>
                <p className="text-sm text-text-dim font-body">
                  Показать только рецепты, заготовки и инструменты готовки
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-portal focus:ring-offset-2 focus:ring-offset-void ${
                settings.enabled
                  ? 'bg-gradient-to-r from-portal to-portal-dim shadow-glow'
                  : 'bg-nebula'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Показать блок подготовки */}
        <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-text-light mb-1">
                Блок подготовки
              </h3>
              <p className="text-sm text-text-dim font-body">
                Показывать блок подготовки ингредиентов
              </p>
            </div>
            <button
              onClick={() => updateSettings({ showPrepBlock: !settings.showPrepBlock })}
              className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-portal focus:ring-offset-2 focus:ring-offset-void ${
                settings.showPrepBlock
                  ? 'bg-gradient-to-r from-portal to-portal-dim shadow-glow'
                  : 'bg-nebula'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${
                  settings.showPrepBlock ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Показать параллельную готовку */}
        <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-text-light mb-1">
                Параллельная готовка
              </h3>
              <p className="text-sm text-text-dim font-body">
                Показывать инструменты для параллельной готовки
              </p>
            </div>
            <button
              onClick={() => updateSettings({ showParallelCooking: !settings.showParallelCooking })}
              className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-portal focus:ring-offset-2 focus:ring-offset-void ${
                settings.showParallelCooking
                  ? 'bg-gradient-to-r from-portal to-portal-dim shadow-glow'
                  : 'bg-nebula'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${
                  settings.showParallelCooking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Режим питания Коли: 4 или 5–6 приёмов */}
        <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
          <h3 className="font-heading font-semibold text-text-light mb-2">
            Режим питания Коли
          </h3>
          <p className="text-sm text-text-dim font-body mb-3">
            5–6 приёмов добавляет второй завтрак и второй ужин
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ kolyaMealsMode: '4' })}
              className={`flex-1 px-4 py-2 rounded-button font-heading font-semibold text-sm transition-all ${
                (settings.kolyaMealsMode ?? '4') === '4'
                  ? 'bg-portal text-void shadow-glow'
                  : 'bg-rift text-text-mid hover:bg-nebula border border-nebula'
              }`}
            >
              4 приёма
            </button>
            <button
              onClick={() => updateSettings({ kolyaMealsMode: '5-6' })}
              className={`flex-1 px-4 py-2 rounded-button font-heading font-semibold text-sm transition-all ${
                settings.kolyaMealsMode === '5-6'
                  ? 'bg-portal text-void shadow-glow'
                  : 'bg-rift text-text-mid hover:bg-nebula border border-nebula'
              }`}
            >
              5–6 приёмов
            </button>
          </div>
        </div>

        {/* Время подготовки по умолчанию */}
        <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
          <label className="block text-sm font-heading font-semibold text-text-light mb-2">
            Время подготовки по умолчанию (минут)
          </label>
          <input
            id="default-prep-time"
            name="default-prep-time"
            type="number"
            min="15"
            max="180"
            step="15"
            value={settings.defaultPrepTime}
            onChange={(e) => updateSettings({ defaultPrepTime: parseInt(e.target.value) || 60 })}
            className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
          />
          <p className="mt-2 text-sm text-text-dim font-body">
            Время, за которое нужно начать подготовку перед готовкой
          </p>
        </div>
      </div>
    </div>
  );
}

// default export for React.lazy()
export default ChefSettingsPage;
