/**
 * Единая точка доступа к данным.
 * При наличии VITE_API_URL — IndexedDB + синхронизация с Neon.
 * Без API (статичный деплой, напр. Vercel) — только IndexedDB (seed при старте).
 */

export { dataServiceWithSync as dataService } from './dataServiceWithSync';
