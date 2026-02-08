-- SemeynoYeda: initial schema (mirror of Dexie)
-- Tables use snake_case for Postgres; app maps to camelCase

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  suitable_for TEXT NOT NULL,
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  storage JSONB NOT NULL DEFAULT '{}',
  reheating JSONB,
  version INTEGER,
  source TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_suitable_for ON recipes(suitable_for);

-- Menus (week menu)
CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  days JSONB NOT NULL DEFAULT '[]',
  shopping_list_generated BOOLEAN NOT NULL DEFAULT FALSE,
  shopping_settings JSONB,
  shopping_day TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_week_start ON menus(week_start);
CREATE INDEX IF NOT EXISTS idx_menus_created_at ON menus(created_at);

-- Freezer
CREATE TABLE IF NOT EXISTS freezer (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  name TEXT NOT NULL,
  portions INTEGER NOT NULL,
  portions_remaining INTEGER NOT NULL,
  portions_original INTEGER NOT NULL,
  batch_id TEXT,
  frozen_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  location TEXT,
  for_whom TEXT,
  reheating JSONB
);

CREATE INDEX IF NOT EXISTS idx_freezer_recipe_id ON freezer(recipe_id);
CREATE INDEX IF NOT EXISTS idx_freezer_expiry_date ON freezer(expiry_date);
CREATE INDEX IF NOT EXISTS idx_freezer_for_whom ON freezer(for_whom);

-- Shopping
CREATE TABLE IF NOT EXISTS shopping (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ingredient TEXT NOT NULL,
  total_amount REAL NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_ids TEXT[] NOT NULL DEFAULT '{}',
  marked_missing BOOLEAN DEFAULT FALSE,
  marked_at TEXT,
  source TEXT NOT NULL DEFAULT 'auto',
  covered_by_freezer BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_shopping_ingredient ON shopping(ingredient);
CREATE INDEX IF NOT EXISTS idx_shopping_category ON shopping(category);
CREATE INDEX IF NOT EXISTS idx_shopping_checked ON shopping(checked);

-- Prep plans
CREATE TABLE IF NOT EXISTS prep_plans (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  estimated_time INTEGER NOT NULL DEFAULT 0,
  completed_tasks TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_prep_plans_date ON prep_plans(date);

-- Cooking sessions
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipes TEXT[] NOT NULL DEFAULT '{}',
  timers JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cooking_sessions_date ON cooking_sessions(date);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_meal_type ON cooking_sessions(meal_type);

-- Chef settings
CREATE TABLE IF NOT EXISTS chef_settings (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  show_prep_block BOOLEAN NOT NULL DEFAULT TRUE,
  show_parallel_cooking BOOLEAN NOT NULL DEFAULT TRUE,
  default_prep_time INTEGER NOT NULL DEFAULT 15,
  kolya_meals_mode TEXT DEFAULT '4'  -- '4' | '5-6' for second_breakfast/late_snack
);
