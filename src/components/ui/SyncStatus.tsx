import { useState, useEffect } from 'react';
import { syncService } from '../../lib/syncService';

/**
 * Компонент статуса синхронизации
 * Показывает количество pending изменений и статус онлайн/офлайн
 */
export function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await syncService.getSyncStatus();
      setPendingCount(status.pendingCount);
      setFailedCount(status.failedCount);
      setIsOnline(status.isOnline);
    };

    // Проверяем статус сразу
    checkStatus();

    // Проверяем статус каждые 5 секунд
    const interval = setInterval(checkStatus, 5000);

    // Слушаем события онлайн/офлайн
    const handleOnline = () => {
      setIsOnline(true);
      checkStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center text-xs text-text-muted" style={{ gap: '6px' }}>
        <span>⚠️</span>
        <span>Офлайн режим</span>
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div className="flex items-center text-xs text-ramen" style={{ gap: '6px' }}>
        <span>❌</span>
        <span>Ошибки синхронизации ({failedCount})</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center text-xs text-portal" style={{ gap: '6px' }}>
        <span>🔄</span>
        <span>Синхронизация... ({pendingCount})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-portal-dim" style={{ gap: '6px' }}>
      <span>✓</span>
      <span>Синхронизировано</span>
    </div>
  );
}
