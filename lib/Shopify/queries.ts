import { Product } from "@/lib/schemas";

export type GetProductsPageState = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
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
        variants: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              availableForSale: boolean;
              price: {
                amount: string;
                currencyCode: string;
              }
            }
          }>
        }
      };
    }>;
  };
};

export type ProductsDetailResponse = {
  product: {
    id: string;
    handle: string;
    title: string;
    createdAt: Date;
    description: string;
    descriptionHtml: string;
    productType: string;
    tags: Array<string>;
    availableForSale: boolean;
    featuredImage: null | {
      url: string;
      altText: string | null;
      width: number;
      height: number;
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
          width: number;
          height: number;
        };
      }>
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          availableForSale: boolean;
          selectedOptions: {
            name: string
            value: string
          };
          price: {
            amount: string;
            currencyCode: string;
          }
        }
      }>
    }
  }
}

export type GetProductDetailPageState = {
  product: ProductsDetailResponse['product'];
  error: Error | null;
};


export type CartQueryResponse = {
  id: string,
  checkoutUrl: string,
  totalQuantity: number,
  cost: {
    subtotalAmount: {
      amount: string,
      currencyCode: string
    },
    totalAmount: {
      amount: string,
      currencyCode: string
    }
  },
  lines: {
    edges: {
      node: {
        id: string,
        quantity: number,
        merchandise: {
          id: string,
          title: string,
          product: {
            handle: string,
            title: string
          },
          image: {
            url: string, altText: string, width: string, height: string
          },
          price: {
            amount: string, currencyCode: string
          }
        }
      }
    }
  }
}

export const PRODUCTS_PAGE_QUERY = `
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
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;
// lib/shopify/queries.ts
export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      createdAt
      description
      descriptionHtml
      productType
      tags
      availableForSale
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 1) {
        edges {
          node {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product { handle title }
              image { url altText width height }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($id: ID!) {
    cart(id: $id) { ...CartFragment }
  }
`;