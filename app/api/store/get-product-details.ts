'use server';

import { shopifyServerClient } from '@/lib/Shopify/shopify-server-client';
import { PRODUCT_BY_HANDLE_QUERY, type ProductsDetailResponse } from '@/lib/Shopify/queries';
import { ProductSchema, type Product, type ProductCategories, type ProductTags } from '@/lib/schemas';

export type GetProductDetailFetchState = {
  product: Product & {
    handle: string;
    descriptionHtml: string;
    availableForSale: Boolean;
    images: Array<Product["image"]>
    metafield: ProductsDetailResponse["product"]["metafield"];
  };
  error: Error | null;
};

/**
 * Fetches all products from Supabase
 * Uses dev_products table in development, prod_products in production
 * 
 * @returns Promise<GetProductsActionState> - Array of validated products or error
*/

export const getProductDetailsFetch = async (handle: string): Promise<GetProductDetailFetchState> => {

  try {
    const isDev = process.env.NODE_ENV === 'development';
    const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

    console.log(`Endpoint used: ${productEndpoint}`)

    const shopifyClient = shopifyServerClient(productEndpoint);
    // Fetch product from Shopify

    const { data, errors } = await shopifyClient.request<ProductsDetailResponse>(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
    });

    if (errors?.message || errors?.networkStatusCode || !data) {
      console.error("Error fetching product details | Shopify Storefront SDK errors:", errors, `Shopify Storefront product query failed with: ${errors.message} and status code: ${errors.networkStatusCode}`);
      throw new Error(`Failed to fetch products ${errors?.message}`)
    }

    // Validate and parse product
    const { id, createdAt, title, productType, featuredImage, images, tags: productTags, ...shopifyProduct } = data.product;
    const category: Product["category"] = productType.toLowerCase() as ProductCategories;
    const tags: Product["tags"] = productTags?.map((tag) => (tag.toLowerCase() || 'hiphop') as ProductTags);
    const productImages = images.edges.map(node => (
      node.node
    ))

    const variantId = shopifyProduct.variants.edges[0].node.id

    const product = ProductSchema.parse({
      id,
      handle,
      category,
      tags,
      variantId,
      name: title,
      created_at: createdAt,
      image: featuredImage,
      price: Number(shopifyProduct.variants.edges[0].node.price.amount),
    })

    return {
      product: {
        images: productImages,
        ...product,
        ...shopifyProduct
      },
      error: null,
    };
  } catch (e) {
    console.error('Unexpected error in getProductsAction:', e);
    throw e instanceof Error ? e : new Error('Unknown error occurred while fetching products')
  }
};

