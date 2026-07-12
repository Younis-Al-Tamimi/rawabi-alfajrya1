export interface Category { id: string; name_en: string; name_ar: string; slug: string; sort_order: number; image_url?: string | null; created_at: string }
export interface FlowerImage { id: string; flower_id: string; image_url: string; sort_order: number; created_at: string }
export interface CategoryWithFlowers extends Category { flowers?: Flower[] }
export interface Flower {
  id: string; slug: string; name_en: string; name_ar: string;
  description_en: string | null; description_ar: string | null;
  price: number; category_id: string | null; hidden: boolean;
  view_count: number; like_count: number; created_at: string; updated_at: string;
  category?: Category | null; images?: FlowerImage[];
}
export interface Profile { id: string; display_name: string; avatar_url: string | null; is_admin: boolean; email?: string | null; created_at: string }
export interface Comment {
  id: string; flower_id: string; user_id: string; text: string;
  is_hidden: boolean; like_count: number; created_at: string;
  profiles?: Profile | null; flower?: Flower | null;
}
