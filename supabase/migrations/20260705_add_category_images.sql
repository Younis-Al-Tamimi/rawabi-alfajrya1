/*
# Add image_url column to categories table

Allows admins to add images to categories for display on the home page and admin panel.
*/

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;

-- Update RLS policies if needed (existing policies already allow updates)
