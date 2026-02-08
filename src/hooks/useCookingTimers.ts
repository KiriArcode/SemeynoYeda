import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/db';
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
      const sessions = await db.table('cookingSessions').toArray();
      const allTimers: CookingTimer[] = [];
      sessions.forEach((session) => {
        allTimers.push(...session.timers);
      });
      setTimers(allTimers.filter((t) => !t.isCompleted));
    } catch (error) {
      console.error('Failed to load timers:', error);
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
            // Таймер завершён
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
    // Отправить уведомление
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

      // Сохранить в активную сессию или создать новую
      const today = new Date().toISOString().split('T')[0];
      let session = await db.table('cookingSessions').where('date').equals(today).first();

      if (!session) {
        session = {
          id: nanoid(),
          date: today,
          mealType: 'dinner',
          recipes: [recipeId],
          timers: [],
          startedAt: new Date().toISOString(),
        };
      }

      session.timers.push(timer);
      await db.table('cookingSessions').put(session);

      return timer.id;
    },
    []
  );

  const pauseTimer = useCallback(async (timerId: string) => {
    setTimers((prev) =>
      prev.map((timer) => {
        if (timer.id === timerId) {
          return { ...timer, isActive: false };
        }
        return timer;
      })
    );

    // Обновить в базе данных
    const sessions = await db.table('cookingSessions').toArray();
    for (const session of sessions) {
      const timerIndex = session.timers.findIndex((t: CookingTimer) => t.id === timerId);
      if (timerIndex !== -1) {
        session.timers[timerIndex].isActive = false;
        await db.table('cookingSessions').put(session);
        break;
      }
    }
  }, []);

  const resumeTimer = useCallback(async (timerId: string) => {
    setTimers((prev) =>
      prev.map((timer) => {
        if (timer.id === timerId && !timer.isCompleted) {
          const remaining = timer.endTime - Date.now();
          return {
            ...timer,
            isActive: true,
            endTime: Date.now() + remaining,
          };
        }
        return timer;
      })
    );

    // Обновить в базе данных
    const sessions = await db.table('cookingSessions').toArray();
    for (const session of sessions) {
      const timerIndex = session.timers.findIndex((t: CookingTimer) => t.id === timerId);
      if (timerIndex !== -1) {
        const timer = session.timers[timerIndex];
        const remaining = timer.endTime - Date.now();
        session.timers[timerIndex] = {
          ...timer,
          isActive: true,
          endTime: Date.now() + remaining,
        };
        await db.table('cookingSessions').put(session);
        break;
      }
    }
  }, []);

  const stopTimer = useCallback(async (timerId: string) => {
    setTimers((prev) => prev.filter((timer) => timer.id !== timerId));

    // Обновить в базе данных
    const sessions = await db.table('cookingSessions').toArray();
    for (const session of sessions) {
      session.timers = session.timers.filter((t: CookingTimer) => t.id !== timerId);
      await db.table('cookingSessions').put(session);
    }
  }, []);

  const getActiveTimers = useCallback(() => {
    return timers.filter((t: CookingTimer) => t.isActive && !t.isCompleted);
  }, [timers]);

  const getTimersForRecipes = useCallback(
    (recipeIds: string[]) => {
      return timers.filter((t: CookingTimer) => recipeIds.includes(t.recipeId));
    },
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
