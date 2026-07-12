-- Add email and password_hash columns to profiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Ensure email uniqueness
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'profiles_email_key') THEN
    BEGIN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END$$;

-- Populate email from auth.users for profiles missing email
WITH u AS (
  SELECT id, email FROM auth.users
)
UPDATE public.profiles p
SET email = u.email
FROM u
WHERE p.email IS NULL AND p.id = u.id;

-- For any auth.users without a profile, create one
INSERT INTO public.profiles (id, display_name, email, created_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', 'User'), u.email, now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Recreate trigger to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'display_name', 'User'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure password_hash column is nullable
ALTER TABLE public.profiles ALTER COLUMN password_hash DROP NOT NULL;
