import { z } from "zod"

// --------------------
// ZOD SCHEMAS (Shared Types)
// --------------------

// ✅ Product Schema for Beats, Kits, and Merch
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  category: z.enum(["kit", "pack", "beat", "merch", "bank", "suite", "plugin"]),
  audio_url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  is_exclusive: z.boolean().default(false),
})

export type Product = z.infer<typeof ProductSchema>

// ✅ Cart Item Schema for local + server syncing
export const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
})

export type CartItem = z.infer<typeof CartItemSchema>

// ✅ User Personalization Schema (Interests + Email Prefs)
export const UserPreferencesSchema = z.object({
  userId: z.string(),
  genres: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  receiveEmails: z.boolean().default(true),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().optional(),
  created_at: z.string()
})

export type User = z.infer<typeof UserSchema>

export const LoginFormSchema = z.object({
  email: z.string().email("Please enter a valid email").trim(),
  username: z.string().trim().optional(),
  password: z.string()
              .min(8, 'Password must be at least 8 characters long.')
              .trim()
              .refine((pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw), "Password must contain capital letter and a number.")
})
// --------------------
// SUPABASE TABLES (SQL)
// --------------------

/*
✅ Full DB Tables for Supabase Backend
- Products stored centrally for all users
- Cart items linked to auth users
- Preferences stored securely for auth personalization

  CREATE TABLE products (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    category text CHECK (category IN ('kit', 'beat', 'merch')),
    audio_url text,
    image_url text,
    tags text[],
    is_exclusive boolean DEFAULT false
  );

  CREATE TABLE cart_items (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES products(id),
    quantity integer NOT NULL
  );

  CREATE TABLE user_preferences (
    user_id uuid PRIMARY KEY,
    genres text[],
    interests text[],
    receive_emails boolean DEFAULT true
  );
*/

// --------------------
// TURSO TABLES (SQLITE SCHEMA)
// --------------------

/*
✅ Lightweight Edge DB for fast personalization + local cart fallback
- Low latency read/writes at the edge
- Can hydrate UI instantly and sync with Supabase

  CREATE TABLE preferences (
    user_id TEXT PRIMARY KEY,
    genres TEXT,
    interests TEXT,
    last_visit TEXT
  );

  CREATE TABLE local_cart (
    user_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    PRIMARY KEY (user_id, product_id)
  );
*/

// --------------------
// TL;DR
// --------------------
// ✅ Zod provides shared validation + type safety between client/server
// ✅ Supabase is the secure system of record (auth + products + purchases)
// ✅ Turso is a fast edge cache layer for preferences/cart hydration
// ✅ Stripe handles checkout
// ✅ This setup supports both speed (edge) and reliability (central auth/store)
// ✅ Dummy data can be preloaded via Supabase SQL seed scripts or JSON imports
// ✅ Audio/YouTube preview handled by components using RSC/client hybrid rendering

// This file would be located in /lib/schemas.ts and imported across your app
