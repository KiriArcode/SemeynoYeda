/**
 * Data service — единая точка доступа к API.
 * Заменяет прямые вызовы db.table().
 */

const API = import.meta.env.VITE_API_URL ?? '';

function apiUrl(path: string): string {
  return `${API}/api${path}`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  CookingSession,
  ChefModeSettings,
} from '../data/schema';

export const dataService = {
  recipes: {
    list: (filters?: { category?: string; tags?: string[] }) => {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.tags?.length) params.set('tags', filters.tags.join(','));
      const q = params.toString() ? `?${params}` : '';
      return fetchJson<Recipe[]>(apiUrl(`/data/recipes${q}`));
    },
    get: (id: string) => fetchJson<Recipe>(apiUrl(`/data/recipes/${id}`)),
    create: (recipe: Recipe) =>
      fetchJson<Recipe>(apiUrl('/data/recipes'), {
        method: 'POST',
        body: JSON.stringify(recipe),
      }),
    update: (id: string, recipe: Partial<Recipe>) =>
      fetchJson<Recipe>(apiUrl(`/data/recipes/${id}`), {
        method: 'PUT',
        body: JSON.stringify(recipe),
      }),
    delete: (id: string) =>
      fetch(apiUrl(`/data/recipes/${id}`), { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
      }),
  },

  menus: {
    getCurrent: () => fetchJson<WeekMenu>(apiUrl('/data/menus')),
    get: (id: string) => fetchJson<WeekMenu>(apiUrl(`/data/menus/${id}`)),
    create: (menu: WeekMenu) =>
      fetchJson<WeekMenu>(apiUrl('/data/menus'), {
        method: 'POST',
        body: JSON.stringify(menu),
      }),
    update: (id: string, menu: Partial<WeekMenu>) =>
      fetchJson<WeekMenu>(apiUrl(`/data/menus/${id}`), {
        method: 'PUT',
        body: JSON.stringify(menu),
      }),
    delete: (id: string) =>
      fetch(apiUrl(`/data/menus/${id}`), { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
      }),
  },

  freezer: {
    list: () => fetchJson<FreezerItem[]>(apiUrl('/data/freezer')),
    get: (id: string) => fetchJson<FreezerItem>(apiUrl(`/data/freezer/${id}`)),
    create: (item: FreezerItem) =>
      fetchJson<FreezerItem>(apiUrl('/data/freezer'), {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    update: (id: string, item: Partial<FreezerItem>) =>
      fetchJson<FreezerItem>(apiUrl(`/data/freezer/${id}`), {
        method: 'PUT',
        body: JSON.stringify(item),
      }),
    delete: (id: string) =>
      fetch(apiUrl(`/data/freezer/${id}`), { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
      }),
  },

  shopping: {
    list: () => fetchJson<ShoppingItem[]>(apiUrl('/shopping')),
    bulkPut: (items: ShoppingItem[]) =>
      fetchJson<ShoppingItem[]>(apiUrl('/shopping'), {
        method: 'PUT',
        body: JSON.stringify(items),
      }),
    create: (item: ShoppingItem) =>
      fetchJson<ShoppingItem>(apiUrl('/shopping'), {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    update: (ingredient: string, updates: Partial<ShoppingItem>) =>
      fetchJson<ShoppingItem>(apiUrl(`/shopping/${encodeURIComponent(ingredient)}`), {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (ingredient: string) =>
      fetch(apiUrl(`/shopping/${encodeURIComponent(ingredient)}`), { method: 'DELETE' }).then(
        (r) => {
          if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
        }
      ),
  },

  prepPlans: {
    list: () => fetchJson<PrepPlan[]>(apiUrl('/prep-plans')),
    getByDate: (date: string) =>
      fetchJson<PrepPlan>(apiUrl(`/prep-plans?date=${encodeURIComponent(date)}`)),
    get: (id: string) => fetchJson<PrepPlan>(apiUrl(`/prep-plans/${id}`)),
    create: (plan: PrepPlan) =>
      fetchJson<PrepPlan>(apiUrl('/prep-plans'), {
        method: 'POST',
        body: JSON.stringify(plan),
      }),
    update: (id: string, plan: Partial<PrepPlan>) =>
      fetchJson<PrepPlan>(apiUrl(`/prep-plans/${id}`), {
        method: 'PUT',
        body: JSON.stringify(plan),
      }),
    delete: (id: string) =>
      fetch(apiUrl(`/prep-plans/${id}`), { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
      }),
  },

  cookingSessions: {
    list: () => fetchJson<CookingSession[]>(apiUrl('/data/cooking-sessions')),
    getByDate: (date: string) =>
      fetchJson<CookingSession>(apiUrl(`/data/cooking-sessions?date=${encodeURIComponent(date)}`)),
    get: (id: string) => fetchJson<CookingSession>(apiUrl(`/data/cooking-sessions/${id}`)),
    create: (session: CookingSession) =>
      fetchJson<CookingSession>(apiUrl('/data/cooking-sessions'), {
        method: 'POST',
        body: JSON.stringify(session),
      }),
    update: (id: string, session: Partial<CookingSession>) =>
      fetchJson<CookingSession>(apiUrl(`/data/cooking-sessions/${id}`), {
        method: 'PUT',
        body: JSON.stringify(session),
      }),
  },

  chefSettings: {
    get: (id = 'default') =>
      fetchJson<ChefModeSettings>(apiUrl(`/data/chef-settings?id=${encodeURIComponent(id)}`)),
    save: (settings: ChefModeSettings) =>
      fetchJson<ChefModeSettings>(apiUrl('/data/chef-settings'), {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
};
