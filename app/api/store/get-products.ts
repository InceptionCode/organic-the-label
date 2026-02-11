'use server';

import { type Product, STORE_PAGE_COUNT, STORE_SORTORDER_TRUE, STORE_SORTKEY_CREATED_AT, STORE_SORTORDER_FALSE, STORE_SORTKEY_PRICE, STORE_SORTKEY_TITLE } from '@/lib/schemas';
import { ResolvedProductSearchParams } from '@/lib/product/normalize-search-params';
import { shopifyServerClient } from '@/lib/Shopify/shopify-server-client';
import { PRODUCTS_PAGE_QUERY, type ProductsPageResponse } from '@/lib/Shopify/queries';
import { parseStoreData } from '@/lib/store';
export type GetProductsFetchState = {
  products: Product[];
  hasNext: boolean;
  nextCursor: string | null;
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
    const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

    console.log(`Endpoint used: ${productEndpoint}`)

    const shopifyClient = shopifyServerClient(productEndpoint);
    // Fetch products from Shopify
    // Try with ordering first, fallback to simple select if ordering fails
    const sort = searchParams?.sort ?? 'newest'
    const after = searchParams?.after ?? null; // for pagination
    const tags = (searchParams?.tags ?? []).filter(Boolean);

    let query: string | null = null
    let sortOrder: boolean = STORE_SORTORDER_TRUE
    let sortKey: string = STORE_SORTKEY_CREATED_AT

    if (searchParams?.category && searchParams.category !== 'all') {
      query = `product_type:{${searchParams.category}}`
    }

    if (tags.length !== 0) {
      const tagString = tags.join(' OR ')
      query = query + ` AND tag:${tagString}`
    }

    if (searchParams?.exclusive) query = query + ` AND tag:exclusive`;

    switch (sort) {
      case 'price-low':
        sortOrder = STORE_SORTORDER_FALSE;
        sortKey = STORE_SORTKEY_PRICE
        break;
      case 'price-high':
        sortOrder = STORE_SORTORDER_TRUE;
        sortKey = STORE_SORTKEY_PRICE
        break;
      case 'name-asc':
        sortOrder = STORE_SORTORDER_FALSE;
        sortKey = STORE_SORTKEY_TITLE
      case 'name-desc':
        sortOrder = STORE_SORTORDER_TRUE;
        sortKey = STORE_SORTKEY_TITLE
      default:
    }

    const { data, errors } = await shopifyClient.request<ProductsPageResponse>(PRODUCTS_PAGE_QUERY, {
      variables: {
        first: STORE_PAGE_COUNT,
        after,
        query,
        sortKey,
        sortOrder
      },
    });

    if (errors?.message || errors?.networkStatusCode) {
      console.error("Error fetching products | Shopify Storefront SDK errors:", errors, `Shopify Storefront products query failed with: ${errors.message} and status code: ${errors.networkStatusCode}`);
      // Fallback: try without ordering
      const { data: fallbackData, errors: fallbackError } = await shopifyClient.request<ProductsPageResponse>(PRODUCTS_PAGE_QUERY, {
        variables: {
          STORE_PAGE_COUNT,
          after,
          sortKey: STORE_SORTKEY_CREATED_AT,
          order: STORE_SORTORDER_TRUE
        }
      })

      if (fallbackError) {
        console.error("Error fetching default products | Shopify Storefront SDK errors:", errors, `Shopify Storefront products query failed with: ${errors.message} and status code: ${errors.networkStatusCode}`);
        throw new Error(`Failed to fetch products ${fallbackError.message}`)
      }

      if (!fallbackData || fallbackData.products.edges.length === 0) {
        return {
          products: [],
          hasNext: false,
          nextCursor: null,
          error: null,
        };
      }

      const products = parseStoreData(fallbackData.products.edges)

      return {
        products,
        hasNext: fallbackData.products.pageInfo.hasNextPage,
        nextCursor: fallbackData.products.pageInfo.endCursor,
        error: null,
      };
    }

    if (!data || data.products.edges.length === 0) {
      return {
        products: [],
        hasNext: false,
        nextCursor: null,
        error: null,
      };
    }

    // Validate and parse products
    const products: Product[] = parseStoreData(data.products.edges)

    return {
      products,
      hasNext: data.products.pageInfo.hasNextPage,
      nextCursor: data.products.pageInfo.endCursor,
      error: null,
    };
  } catch (e) {
    console.error('Unexpected error in getProductsAction:', e);
    throw e instanceof Error ? e : new Error('Unknown error occurred while fetching products')
  }
};

