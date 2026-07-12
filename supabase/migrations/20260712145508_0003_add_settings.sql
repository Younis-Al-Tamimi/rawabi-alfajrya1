-- Add settings table for storing global site settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_settings" ON settings;
CREATE POLICY "read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_settings_admin" ON settings;
CREATE POLICY "update_settings_admin" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "insert_settings_admin" ON settings;
CREATE POLICY "insert_settings_admin" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Initialize hero_image setting
INSERT INTO settings (key, value) VALUES ('hero_image', NULL)
ON CONFLICT (key) DO NOTHING;

-- Initialize admin_passcode setting
INSERT INTO settings (key, value) VALUES ('admin_passcode', '1234')
ON CONFLICT (key) DO NOTHING;

-- Trigger: update settings.updated_at
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
