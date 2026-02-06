-- ============================================
-- PROFESSIONAL_SERVICES: Split FOR ALL into per-command policies
-- ============================================

-- Drop existing FOR ALL policy
DROP POLICY IF EXISTS "Users manage own services" ON professional_services;

-- Create per-command policies
CREATE POLICY "professional_services_select_own"
ON professional_services FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "professional_services_insert_own"
ON professional_services FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional_services_update_own"
ON professional_services FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional_services_delete_own"
ON professional_services FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PROFESSIONAL_MICRO_PREFERENCES: Split FOR ALL into per-command policies
-- ============================================

-- Drop existing FOR ALL policy
DROP POLICY IF EXISTS "Users manage own preferences" ON professional_micro_preferences;

-- Create per-command policies
CREATE POLICY "pro_micro_prefs_select_own"
ON professional_micro_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_insert_own"
ON professional_micro_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_update_own"
ON professional_micro_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_delete_own"
ON professional_micro_preferences FOR DELETE
USING (auth.uid() = user_id);