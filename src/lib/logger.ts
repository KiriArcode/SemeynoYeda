/**
 * Logger — условное логирование для dev-режима.
 *
 * В production (import.meta.env.PROD === true) все вызовы log/warn — noop.
 * error всегда выводится.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Обычный лог (только в dev) */
  log(...args: unknown[]): void {
    if (isDev) console.log(...args);
  },

  /** Предупреждение (только в dev) */
  warn(...args: unknown[]): void {
    if (isDev) console.warn(...args);
  },

  /** Ошибка (всегда) */
  error(...args: unknown[]): void {
    console.error(...args);
  },

  /** Группированный лог (только в dev) */
  group(label: string): void {
    if (isDev) console.group(label);
  },

  groupEnd(): void {
    if (isDev) console.groupEnd();
  },
};
