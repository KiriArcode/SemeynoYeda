-- RLS: invite-only, family access
-- All tables require auth.uid() IS NOT NULL

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE freezer ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "menus_select" ON menus FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menus_insert" ON menus FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "menus_update" ON menus FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "menus_delete" ON menus FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "freezer_select" ON freezer FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "freezer_insert" ON freezer FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "freezer_update" ON freezer FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "freezer_delete" ON freezer FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "shopping_select" ON shopping FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shopping_insert" ON shopping FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "shopping_update" ON shopping FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "shopping_delete" ON shopping FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "prep_plans_select" ON prep_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prep_plans_insert" ON prep_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "prep_plans_update" ON prep_plans FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "prep_plans_delete" ON prep_plans FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "cooking_sessions_select" ON cooking_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cooking_sessions_insert" ON cooking_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cooking_sessions_update" ON cooking_sessions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "cooking_sessions_delete" ON cooking_sessions FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "chef_settings_select" ON chef_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chef_settings_insert" ON chef_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "chef_settings_update" ON chef_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "chef_settings_delete" ON chef_settings FOR DELETE USING (auth.uid() IS NOT NULL);
