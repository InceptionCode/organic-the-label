import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/store/cart-cookie";
import { shopifyServerClient } from "@/lib/Shopify/shopify-server-client";
import { CART_QUERY, CartQueryResponse } from "@/lib/Shopify/queries";

export async function GET() {
  const isDev = process.env.NODE_ENV === 'development';
  const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

  const shopifyClient = shopifyServerClient(productEndpoint)

  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value ?? null;

  if (!cartId) return NextResponse.json({ ok: true, cart: null });

  const { data, errors } = await shopifyClient.request<CartQueryResponse>(CART_QUERY, { variables: { id: cartId } });

  if (errors?.networkStatusCode) {
    console.error('errors', errors);
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cart: data });
}