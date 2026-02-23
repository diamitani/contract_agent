-- Ensure user profiles carry explicit platform tagging for this app.
-- This migration is safe to run multiple times.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'contract_agent';

UPDATE user_profiles
SET platform = COALESCE(NULLIF(registered_app_id, ''), 'contract_agent')
WHERE platform IS NULL;

ALTER TABLE user_profiles
ALTER COLUMN platform SET DEFAULT 'contract_agent';

CREATE INDEX IF NOT EXISTS user_profiles_platform_idx ON user_profiles(platform);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, registered_app_id, platform)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'app_id', 'contract_agent'),
    COALESCE(NEW.raw_user_meta_data->>'app_id', 'contract_agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
