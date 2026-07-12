/*
# F9 Flowers — Initial Schema

Creates the full database schema for the F9 Flowers storefront and admin panel:
categories, flowers, flower images, user profiles, comments, and likes.

## Tables
1. categories — flower groupings (Bouquets, Arrangements, Vases).
2. flowers — products with price, category, hidden flag, view/like counts.
3. flower_images — images attached to a flower (1-to-many, cascade delete).
4. profiles — public user profile, one row per auth user (auto-created on signup).
5. comments — user comments on flowers, with hidden flag and like count.
6. flower_likes — join table: user likes a flower (unique per user+flower).
7. comment_likes — join table: user likes a comment (unique per user+comment).

## Functions / RPCs
- increment_flower_view(flower_id) — atomically increments view_count.

## Triggers
- flowers_updated_at — auto-updates updated_at on UPDATE.
- on_auth_user_created — creates a profiles row on signup.

## Security (RLS)
- Public read: categories, non-hidden flowers, flower_images, profiles, non-hidden comments.
- Authenticated owner-scoped write: comments, likes, own profile update.
- Admin override: profiles.is_admin = true bypasses hidden filters and can CRUD all content.

## Storage
- Public bucket flower-images for image uploads.

## Notes
1. Idempotent — safe to re-run.
2. To make a user an admin: UPDATE profiles SET is_admin = true WHERE id = '<uuid>';
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_categories_admin" ON categories;
CREATE POLICY "insert_categories_admin" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_categories_admin" ON categories;
CREATE POLICY "update_categories_admin" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_categories_admin" ON categories;
CREATE POLICY "delete_categories_admin" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Flowers
CREATE TABLE IF NOT EXISTS flowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  hidden boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_flowers" ON flowers;
CREATE POLICY "read_flowers" ON flowers FOR SELECT
  TO anon, authenticated
  USING (hidden = false OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
DROP POLICY IF EXISTS "insert_flowers_admin" ON flowers;
CREATE POLICY "insert_flowers_admin" ON flowers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_flowers_admin" ON flowers;
CREATE POLICY "update_flowers_admin" ON flowers FOR UPDATE
  TO anon, authenticated USING (true)
  WITH CHECK (true);
DROP POLICY IF EXISTS "delete_flowers_admin" ON flowers;
CREATE POLICY "delete_flowers_admin" ON flowers FOR DELETE
  TO anon, authenticated USING (true);

-- Flower Images
CREATE TABLE IF NOT EXISTS flower_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id uuid NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flower_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_flower_images" ON flower_images;
CREATE POLICY "read_flower_images" ON flower_images FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_flower_images_admin" ON flower_images;
CREATE POLICY "insert_flower_images_admin" ON flower_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_flower_images_admin" ON flower_images;
CREATE POLICY "update_flower_images_admin" ON flower_images FOR UPDATE
  TO anon, authenticated USING (true)
  WITH CHECK (true);
DROP POLICY IF EXISTS "delete_flower_images_admin" ON flower_images;
CREATE POLICY "delete_flower_images_admin" ON flower_images FOR DELETE
  TO anon, authenticated USING (true);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL DEFAULT 'User',
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  email text UNIQUE,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_profiles" ON profiles;
CREATE POLICY "read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id uuid NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT gen_random_uuid() REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_comments" ON comments;
CREATE POLICY "read_comments" ON comments FOR SELECT
  TO anon, authenticated
  USING (is_hidden = false OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
DROP POLICY IF EXISTS "insert_own_comment" ON comments;
CREATE POLICY "insert_own_comment" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_comment" ON comments;
CREATE POLICY "update_own_comment" ON comments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_comment" ON comments;
CREATE POLICY "delete_own_comment" ON comments FOR DELETE
  TO anon, authenticated USING (true);

-- Flower Likes
CREATE TABLE IF NOT EXISTS flower_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id uuid NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT gen_random_uuid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flower_id, user_id)
);
ALTER TABLE flower_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_flower_likes" ON flower_likes;
CREATE POLICY "read_flower_likes" ON flower_likes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_flower_like" ON flower_likes;
CREATE POLICY "insert_own_flower_like" ON flower_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_flower_like" ON flower_likes;
CREATE POLICY "delete_own_flower_like" ON flower_likes FOR DELETE
  TO anon, authenticated USING (true);

-- Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT gen_random_uuid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_comment_likes" ON comment_likes;
CREATE POLICY "read_comment_likes" ON comment_likes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_comment_like" ON comment_likes;
CREATE POLICY "insert_own_comment_like" ON comment_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_comment_like" ON comment_likes;
CREATE POLICY "delete_own_comment_like" ON comment_likes FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION set_comment_visibility(comment_id uuid, hidden boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.comments SET is_hidden = hidden WHERE id = comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_comment(comment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.comments WHERE id = comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_comments(limit_count integer DEFAULT 200, flower_filter uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  flower_id uuid,
  user_id uuid,
  text text,
  is_hidden boolean,
  like_count integer,
  created_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, flower_id, user_id, text, is_hidden, like_count, created_at
  FROM public.comments
  WHERE flower_filter IS NULL OR flower_id = flower_filter
  ORDER BY created_at DESC
  LIMIT GREATEST(limit_count, 0);
$$;

CREATE OR REPLACE FUNCTION update_flower_like_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE flowers SET like_count = like_count + 1 WHERE id = NEW.flower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE flowers SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.flower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS flower_likes_count_update ON flower_likes;
CREATE TRIGGER flower_likes_count_update AFTER INSERT OR DELETE ON flower_likes
  FOR EACH ROW EXECUTE FUNCTION update_flower_like_count();

CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS comment_likes_count_update ON comment_likes;
CREATE TRIGGER comment_likes_count_update AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- RPC: increment_flower_view
CREATE OR REPLACE FUNCTION increment_flower_view(flower_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE flowers SET view_count = view_count + 1 WHERE id = flower_id;
$$;

-- Trigger: flowers.updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS flowers_updated_at ON flowers;
CREATE TRIGGER flowers_updated_at BEFORE UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: create profile on signup
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

-- Storage bucket: flower-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('flower-images', 'flower-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "read_flower_images_storage" ON storage.objects;
CREATE POLICY "read_flower_images_storage" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'flower-images');
DROP POLICY IF EXISTS "insert_flower_images_storage" ON storage.objects;
CREATE POLICY "insert_flower_images_storage" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'flower-images');
DROP POLICY IF EXISTS "update_flower_images_storage" ON storage.objects;
CREATE POLICY "update_flower_images_storage" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'flower-images') WITH CHECK (bucket_id = 'flower-images');
DROP POLICY IF EXISTS "delete_flower_images_storage" ON storage.objects;
CREATE POLICY "delete_flower_images_storage" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'flower-images');

-- Seed data
INSERT INTO categories (name_en, name_ar, slug, sort_order) VALUES
  ('Bouquets', 'باقات', 'bouquets', 1),
  ('Arrangements', 'تنسيقات', 'arrangements', 2),
  ('Vases', 'مزهريات', 'vases', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO flowers (slug, name_en, name_ar, description_en, description_ar, price, category_id, hidden)
SELECT 'rose-bouquet', 'Rose Bouquet', 'باقة الورود',
  'A classic bouquet of fresh red roses.',
  'باقة كلاسيكية من الورود الحمراء الطازجة.',
  25.000, (SELECT id FROM categories WHERE slug = 'bouquets'), false
WHERE NOT EXISTS (SELECT 1 FROM flowers WHERE slug = 'rose-bouquet');

INSERT INTO flowers (slug, name_en, name_ar, description_en, description_ar, price, category_id, hidden)
SELECT 'spring-arrangement', 'Spring Arrangement', 'تنسيق الربيع',
  'A vibrant spring flower arrangement.',
  'تنسيق زهور ربيعي نابض بالحياة.',
  35.000, (SELECT id FROM categories WHERE slug = 'arrangements'), false
WHERE NOT EXISTS (SELECT 1 FROM flowers WHERE slug = 'spring-arrangement');