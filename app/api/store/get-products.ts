'use server';

import { ProductSchema, type Product, ProductCategories } from '@/lib/schemas';
import { ResolvedProductSearchParams } from '@/lib/product/normalize-search-params';
import { createSupabasePublicClient } from '@/lib/supabase/unsecure-base';

export type GetProductsFetchState = {
  products: Product[];
  error: Error | null;
};

/**
 * Fetches all products from Supabase
 * Uses dev_products table in development, prod_products in production
 * 
 * @returns Promise<GetProductsActionState> - Array of validated products or error
*/

export const getProductsFetch = async (searchParams?: ResolvedProductSearchParams): Promise<GetProductsFetchState> => {

  try {
    const isDev = process.env.NODE_ENV === 'development';
    const productTable = isDev ? 'dev_products' : 'prod_products';
    const supabase = await createSupabasePublicClient();
    // Fetch products from Supabase
    // Try with ordering first, fallback to simple select if ordering fails
    const sort = searchParams?.sort ?? 'newest'

    let query = supabase
      .from(productTable)
      .select('*')

    if (searchParams?.category && searchParams.category !== 'all') {
      query = query.contains('category', `{${searchParams.category}}`)
    }

    if (searchParams?.exclusive) query = query.eq('is_exclusive', true);

    switch (sort) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'name-asc':
        query = query.order('name', { ascending: true })
      case 'name-desc':
        query = query.order('name', { ascending: false })
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query

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

          const category: Product["category"] = product.category?.map((type: string) => type.replace(/[{}]/g, '') || 'kit');

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
        const category: Product["category"] = product.category?.map((type) => (type.replace(/[{}]/g, '') || 'kit') as ProductCategories);

        return ProductSchema.parse({
          ...product,
          category,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        });
      } catch (parseError) {
        console.error('Error parsing product:', product, parseError);

        console.log('>>>>> category', product.category)
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

