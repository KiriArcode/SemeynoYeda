import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import type { WeekMenu } from '../data/schema';

export interface FreezerAlert {
  type: 'low-stock' | 'expiring' | 'suggestion';
  message: string;
  itemId?: string;
}

export function useFreezerAlerts(weekMenu: WeekMenu | null) {
  const [alerts, setAlerts] = useState<FreezerAlert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, [weekMenu]);

  async function loadAlerts() {
    try {
      const items = await dataService.freezer.list();
      const newAlerts: FreezerAlert[] = [];
      const now = new Date();

      for (const item of items) {
        // Low stock
        if (item.portionsRemaining <= 2 && item.portionsRemaining > 0) {
          newAlerts.push({
            type: 'low-stock',
            message: `${item.name} — осталось ${item.portionsRemaining} порц.`,
            itemId: item.id,
          });
        }

        // Expiring within 3 days
        const expiry = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
          newAlerts.push({
            type: 'expiring',
            message: `${item.name} истекает через ${daysUntilExpiry} дн.`,
            itemId: item.id,
          });
        } else if (daysUntilExpiry <= 0) {
          newAlerts.push({
            type: 'expiring',
            message: `${item.name} — срок истёк!`,
            itemId: item.id,
          });
        }
      }

      // Check if freezer covers planned meals
      if (weekMenu && items.length > 0) {
        let frozenCovered = 0;
        let frozenNeeded = 0;
        for (const day of weekMenu.days) {
          for (const meal of day.meals) {
            for (const entry of meal.recipes) {
              if (entry.usesFromFreezer && entry.usesFromFreezer.length > 0) {
                frozenNeeded++;
                const allCovered = entry.usesFromFreezer.every(fu => {
                  const fi = items.find(i => i.id === fu.freezerItemId);
                  return fi && fi.portionsRemaining >= fu.portions;
                });
                if (allCovered) frozenCovered++;
              }
            }
          }
        }
        if (frozenNeeded > 0 && frozenCovered < frozenNeeded) {
          newAlerts.push({
            type: 'suggestion',
            message: `${frozenNeeded - frozenCovered} блюд из морозилки нужно пополнить — запланируйте заготовки`,
          });
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('[useFreezerAlerts] Error:', error);
    }
  }

  return { alerts, refresh: loadAlerts };
}
