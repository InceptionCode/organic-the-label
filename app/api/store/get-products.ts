'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server-base';
import { ProductSchema, type Product } from '@/lib/schemas';
import { ProductDB } from '@/lib/supabase/supabase-schema';

export type GetProductsActionState = {
  products: Product[];
  error: Error | null;
};

/**
 * Fetches all products from Supabase
 * Uses dev_products table in development, prod_products in production
 * 
 * @returns Promise<GetProductsActionState> - Array of validated products or error
 */
export const getProductsAction = async (): Promise<GetProductsActionState> => {
  try {
    const supabase = await createSupabaseServerClient();
    const isDev = process.env.NODE_ENV === 'development';
    const productTable = isDev ? 'dev_products' : 'prod_products';

    // Fetch products from Supabase
    // Try with ordering first, fallback to simple select if ordering fails
    const { data, error } = await supabase
      .from(productTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products with ordering:', error);
      // Fallback: try without ordering
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(productTable)
        .select('*');

      if (fallbackError) {
        console.error('Error fetching products:', fallbackError);
        return {
          products: [],
          error: new Error(`Failed to fetch products: ${fallbackError.message}`),
        };
      }

      if (!fallbackData || fallbackData.length === 0) {
        return {
          products: [],
          error: null,
        };
      }

      // Parse fallback data
      const products = fallbackData.map((product) => {
        try {
          // Handle category format (might be "{kit}" or just "kit")
          const category = product.category?.replace(/[{}]/g, '') || 'kit';

          return ProductSchema.parse({
            ...product,
            category,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          });
        } catch (parseError) {
          console.error('Error parsing product:', product, parseError);
          return null;
        }
      }).filter((product): product is Product => product !== null);

      return {
        products,
        error: null,
      };
    }

    if (!data || data.length === 0) {
      return {
        products: [],
        error: null,
      };
    }

    // Validate and parse products
    const products: Product[] = data.map((product: Product) => {
      try {
        const category = product.category?.toString() || 'kit';

        return ProductSchema.parse({
          ...product,
          category,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        });
      } catch (parseError) {
        console.error('Error parsing product:', product, parseError);
        return null;
      }
    }).filter((product): product is Product => product !== null);

    return {
      products,
      error: null,
    };
  } catch (e) {
    console.error('Unexpected error in getProductsAction:', e);
    return {
      products: [],
      error: e instanceof Error ? e : new Error('Unknown error occurred while fetching products'),
    };
  }
};

