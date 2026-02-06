import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { FreezerItem } from '../data/schema';
import { Snowflake } from 'lucide-react';

export default function FreezerPage() {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const allItems = await db.table('freezer').toArray();
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load freezer items:', error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center gap-3 mb-6">
        <Snowflake className="w-6 h-6 text-frost" />
        <h1 className="font-heading text-2xl font-bold text-text-light">
          Морозилка
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-dimension border border-nebula rounded-card p-5 text-center">
          <p className="text-text-mid font-body">
            Пустота... как в измерении без еды ❄️
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-dimension border border-nebula rounded-card p-4 shadow-card"
            >
              <h3 className="font-heading font-semibold text-text-light mb-2">
                {item.name}
              </h3>
              <div className="text-sm text-text-mid font-body space-y-1">
                <p>Порций: {item.portions}</p>
                <p className="font-mono text-text-dim">
                  Заморожено: {new Date(item.frozenDate).toLocaleDateString('ru-RU')}
                </p>
                <p className="font-mono text-frost">
                  Годно до: {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
                </p>
                {item.location && (
                  <p className="text-text-dim">Место: {item.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
