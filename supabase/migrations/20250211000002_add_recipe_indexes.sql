-- Add indexes on title and slug for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
