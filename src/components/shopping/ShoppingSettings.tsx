import { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';
import type { ShoppingSettings } from '../../data/schema';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Понедельник' },
  { value: 'tuesday', label: 'Вторник' },
  { value: 'wednesday', label: 'Среда' },
  { value: 'thursday', label: 'Четверг' },
  { value: 'friday', label: 'Пятница' },
  { value: 'saturday', label: 'Суббота' },
  { value: 'sunday', label: 'Воскресенье' },
] as const;

export function ShoppingSettings() {
  const [settings, setSettings] = useState<ShoppingSettings>({
    shoppingDay: 'saturday',
    autoGenerate: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const saved = await dataService.menus.getCurrent().catch(() => null);
      if (saved?.shoppingSettings) {
        setSettings(saved.shoppingSettings);
      }
    } catch (error) {
      console.error('Failed to load shopping settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(newSettings: ShoppingSettings) {
    setSettings(newSettings);
    try {
      const currentMenu = await dataService.menus.getCurrent().catch(() => null);
      if (currentMenu) {
        await dataService.menus.update(currentMenu.id, {
          shoppingSettings: newSettings,
        });
      }
    } catch (error) {
      console.error('Failed to save shopping settings:', error);
    }
  }

  function getNextShoppingDate(day: string): string {
    const dayMap: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = dayMap[day];
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7;
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  }

  if (loading) {
    return (
      <div className="bg-dimension border border-nebula rounded-card p-4">
        <div className="text-text-mid font-body">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
      <h3 className="font-heading text-xl font-bold text-text-light mb-4">
        Настройки покупок
      </h3>

      <div className="space-y-4">
        {/* Выбор дня покупок */}
        <div>
          <label className="block text-sm font-heading font-semibold text-text-mid mb-2">
            День покупок
          </label>
          <select
            id="shopping-day"
            name="shopping-day"
            value={settings.shoppingDay}
            onChange={(e) =>
              saveSettings({
                ...settings,
                shoppingDay: e.target.value as ShoppingSettings['shoppingDay'],
              })
            }
            className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-text-dim font-body">
            Следующая покупка: {getNextShoppingDate(settings.shoppingDay)}
          </p>
        </div>

        {/* Переключатель автогенерации */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-heading font-semibold text-text-light">
              Автоматическая генерация списка
            </label>
            <p className="text-sm text-text-dim font-body mt-1">
              Список будет создаваться автоматически из меню недели
            </p>
          </div>
          <button
            onClick={() =>
              saveSettings({ ...settings, autoGenerate: !settings.autoGenerate })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-portal focus:ring-offset-2 focus:ring-offset-void ${
              settings.autoGenerate
                ? 'bg-gradient-to-r from-portal to-portal-dim shadow-glow'
                : 'bg-nebula'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${
                settings.autoGenerate ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
