import { useState, useEffect, useRef, useCallback } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { CookingTimer } from '../data/schema';
import { nanoid } from 'nanoid';

export function useCookingTimers() {
  const [timers, setTimers] = useState<CookingTimer[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadActiveTimers();
  }, []);

  useEffect(() => {
    if (timers.some((t) => t.isActive)) {
      startInterval();
    } else {
      stopInterval();
    }
    return () => {
      stopInterval();
    };
  }, [timers]);

  async function loadActiveTimers() {
    try {
      const sessions = await dataService.cookingSessions.list();
      const allTimers: CookingTimer[] = [];
      sessions.forEach((session) => {
        allTimers.push(...session.timers);
      });
      setTimers(allTimers.filter((t) => !t.isCompleted));
    } catch (error) {
      logger.error('Failed to load timers:', error);
    }
  }

  function startInterval() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const now = Date.now();
        return prev.map((timer) => {
          if (!timer.isActive || timer.isCompleted) return timer;
          if (now >= timer.endTime) {
            handleTimerComplete(timer.id);
            return { ...timer, isActive: false, isCompleted: true };
          }
          return timer;
        });
      });
    }, 1000);
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function handleTimerComplete(timerId: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const timer = timers.find((t) => t.id === timerId);
      if (timer) {
        new Notification('Таймер завершён', {
          body: timer.label,
          icon: '/icons/icon-192.png',
        });
      }
    }
  }

  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  const startTimer = useCallback(
    async (recipeId: string, stepOrder: number, label: string, duration: number) => {
      await requestNotificationPermission();

      const timer: CookingTimer = {
        id: nanoid(),
        recipeId,
        stepOrder,
        label,
        duration,
        startTime: Date.now(),
        endTime: Date.now() + duration * 1000,
        isActive: true,
        isCompleted: false,
      };

      setTimers((prev) => [...prev, timer]);

      const today = new Date().toISOString().split('T')[0];
      let session = await dataService.cookingSessions.getByDate(today).catch(() => null);

      if (!session) {
        session = {
          id: nanoid(),
          date: today,
          mealType: 'dinner',
          recipes: [recipeId],
          timers: [timer],
          startedAt: new Date().toISOString(),
        };
        await dataService.cookingSessions.create(session);
      } else {
        session.timers.push(timer);
        await dataService.cookingSessions.update(session.id, session);
      }

      return timer.id;
    },
    []
  );

  const pauseTimer = useCallback(async (timerId: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === timerId ? { ...t, isActive: false } : t))
    );

    const sessions = await dataService.cookingSessions.list();
    for (const session of sessions) {
      const idx = session.timers.findIndex((t: CookingTimer) => t.id === timerId);
      if (idx !== -1) {
        session.timers[idx] = { ...session.timers[idx], isActive: false };
        await dataService.cookingSessions.update(session.id, session);
        break;
      }
    }
  }, []);

  const resumeTimer = useCallback(async (timerId: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === timerId && !t.isCompleted) {
          const remaining = t.endTime - Date.now();
          return { ...t, isActive: true, endTime: Date.now() + remaining };
        }
        return t;
      })
    );

    const sessions = await dataService.cookingSessions.list();
    for (const session of sessions) {
      const idx = session.timers.findIndex((t: CookingTimer) => t.id === timerId);
      if (idx !== -1) {
        const timer = session.timers[idx];
        const remaining = timer.endTime - Date.now();
        session.timers[idx] = {
          ...timer,
          isActive: true,
          endTime: Date.now() + remaining,
        };
        await dataService.cookingSessions.update(session.id, session);
        break;
      }
    }
  }, []);

  const stopTimer = useCallback(async (timerId: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== timerId));

    const sessions = await dataService.cookingSessions.list();
    for (const session of sessions) {
      const filtered = session.timers.filter((t: CookingTimer) => t.id !== timerId);
      if (filtered.length !== session.timers.length) {
        await dataService.cookingSessions.update(session.id, { timers: filtered });
        break;
      }
    }
  }, []);

  const getActiveTimers = useCallback(
    () => timers.filter((t) => t.isActive && !t.isCompleted),
    [timers]
  );

  const getTimersForRecipes = useCallback(
    (recipeIds: string[]) => timers.filter((t) => recipeIds.includes(t.recipeId)),
    [timers]
  );

  const getRemainingTime = useCallback((timer: CookingTimer): number => {
    if (timer.isCompleted) return 0;
    const remaining = timer.endTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }, []);

  return {
    timers,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getActiveTimers,
    getTimersForRecipes,
    getRemainingTime,
  };
}
