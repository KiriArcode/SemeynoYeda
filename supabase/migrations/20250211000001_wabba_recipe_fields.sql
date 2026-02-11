-- Wabba: оценки Коля/Кристина и исключение из меню
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS wabba_ratings JSONB;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS excluded_from_menu BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
