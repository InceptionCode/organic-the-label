// lib/shopify/queries.ts

import { Product } from "@/lib/schemas";

/*
 * Query to get a page of products from Shopify StoreFront
 * @param first - The number of products to return
 * @param after - The cursor to return the next page of products
 * @returns Promise<GetProductsPageState> - The page of products
 */

export type GetProductsPageState = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
  products: Product[];
  error: Error | null;
};


export type ProductsPageResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        handle: string;
        title: string;
        createdAt: Date;
        availableForSale: boolean;
        productType: string;
        tags: Array<string>;
        featuredImage: null | {
          url: string;
          altText: string | null;
          width: number;
          height: number;
        };
        priceRange: {
          minVariantPrice: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
};

export const PRODUCTS_PAGE_QUERY = /* GraphQL */ `
  query ProductsPage($first: Int!, $after: String, $sortKey: ProductSortKeys, $sortOrder: Boolean, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $sortOrder) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges { 
        cursor
        node {
          id
          handle
          title
          createdAt
          availableForSale
          productType
          tags
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
