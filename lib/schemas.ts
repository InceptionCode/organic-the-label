import { z } from "zod/v4"

// --------------------
// ZOD SCHEMAS (Shared Types)
// --------------------

// ✅ Product Schema for Beats, Kits, and Merch
const categoryKit = z.literal("kit")
const categoryBeat = z.literal("beat")
const categoryPack = z.literal("pack")
const categoryMerch = z.literal("merch")
const categoryBank = z.literal("bank")
const categoryPlugin = z.literal("plugin")
const categorySuite = z.literal("suite")
const categoryFree = z.literal("free")

// Create a union type for category options
export const unionCategories = z.union([categoryBank, categoryBeat, categoryFree, categoryKit, categoryMerch, categoryPack, categoryPlugin, categorySuite]);
export type ProductCategories = z.infer<typeof unionCategories>

export const ProductSchema = z.object({
  created_at: z.iso.date(),
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  category: z.array(unionCategories),
  audio_url: z.preprocess(
    (arg) => (typeof arg === 'string' && arg === '' ? undefined : arg),
    z.url().optional()
  ),
  image_url: z.preprocess(
    (arg) => (typeof arg === 'string' && arg === '' ? undefined : arg),
    z.url().optional()
  ),
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
  username: z.string(),
  created_at: z.string(),
  confirmed_at: z.string(),
  isAnon: z.boolean(),
  id: z.string().optional(),
  updated_at: z.string().optional(),
  last_signed_in: z.string().optional(),
  avatar_url: z.string().optional(),
  preferences: UserPreferencesSchema.optional()
})

export type User = z.infer<typeof UserSchema>

export const SigninFormSchema = z.object({
  email: z.email("Please enter a valid email").trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long.')
    .trim()
    .refine((pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw), "Password must contain capital letter and a number.")
})

export type SigninForm = z.infer<typeof SigninFormSchema>

export const SignupFormSchema = z.object({
  email: z.email("Please enter a valid email").trim(),
  username: z.string()
    .trim()
    .refine((uname) => /^[a-zA-Z0-9._-]+$/.test(uname), "Username must NOT contain special characters"),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long.')
    .trim()
    .refine((pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw), "Password must contain capital letter and a number."),
  confirmPassword: z.string()
    .min(8, 'Password must be at least 8 characters long.')
    .trim()
    .refine((pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw), "Password must contain capital letter and a number.")
}).superRefine(({ confirmPassword, password }, ctx) => {
  if (confirmPassword !== password) {
    ctx.addIssue({
      code: 'custom',
      message: 'Password and confirm password must match',
      path: ['confirmPassword']
    })
  }
})

export type SignupForm = z.infer<typeof SignupFormSchema>

const mergeSignUpForm = SignupFormSchema.pick({ confirmPassword: true })
export const UpdateUserFormSchema = SigninFormSchema.extend({
  username: z.string().optional(),
  email: z.string().optional(),
  avatar_url: z.string().optional()
}).extend(mergeSignUpForm.shape)
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword']
      })
    }
  })

export type UpdateUserForm = z.infer<typeof UpdateUserFormSchema>

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
