-- Add app_id columns to track which app users registered from and current platform usage
-- App ID for this platform: "academy"

-- Add registered_app_id to user_profiles (where user initially signed up)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS registered_app_id TEXT DEFAULT 'academy';

-- Add app_id to analytics_events (which platform generated the event)
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT 'academy';

-- Add app_id to contracts (which platform was used to create)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT 'academy';

-- Add app_id to uploaded_files (which platform was used to upload)
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT 'academy';

-- Add app_id to payments (which platform processed the payment)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS app_id TEXT DEFAULT 'academy';

-- Update existing records to have the default app_id
UPDATE user_profiles SET registered_app_id = 'academy' WHERE registered_app_id IS NULL;
UPDATE analytics_events SET app_id = 'academy' WHERE app_id IS NULL;
UPDATE contracts SET app_id = 'academy' WHERE app_id IS NULL;
UPDATE uploaded_files SET app_id = 'academy' WHERE app_id IS NULL;
UPDATE payments SET app_id = 'academy' WHERE app_id IS NULL;

-- Create indexes for app_id queries
CREATE INDEX IF NOT EXISTS user_profiles_registered_app_id_idx ON user_profiles(registered_app_id);
CREATE INDEX IF NOT EXISTS analytics_events_app_id_idx ON analytics_events(app_id);
CREATE INDEX IF NOT EXISTS contracts_app_id_idx ON contracts(app_id);
CREATE INDEX IF NOT EXISTS uploaded_files_app_id_idx ON uploaded_files(app_id);
CREATE INDEX IF NOT EXISTS payments_app_id_idx ON payments(app_id);

-- Update the handle_new_user function to include registered_app_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, registered_app_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'app_id', 'academy')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
