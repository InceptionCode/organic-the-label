import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/store/cart-cookie";
import { shopifyServerClient } from "@/lib/Shopify/shopify-server-client";
import { CART_LINES_ADD_MUTATION, CartLinesRemove, type CartLinesAddResponse, type CartState } from "@/lib/Shopify/mutations";

type RemoveBody = { variantId: string; quantity?: number };

export async function POST(req: Request): Promise<NextResponse<CartState>> {
  const isDev = process.env.NODE_ENV === 'development';
  const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

  const shopifyClient = shopifyServerClient(productEndpoint)

  const { variantId, quantity = 1 } = (await req.json()) as RemoveBody;

  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value ?? null;

  const line = { merchandiseId: variantId, quantity };

  if (!cartId) {
    console.error("Cart does not exist!")

    throw new Error("Cart (item) could not be remove")
  }

  const { data, errors } = await shopifyClient.request<CartLinesRemove>(CART_LINES_ADD_MUTATION, {
    variables: { cartId, lineIds: [line] },
  });

  if (errors?.networkStatusCode) return NextResponse.json({ ok: false, errors }, { status: 500 });

  const removed = data?.cartLinesRemove;
  if (removed?.userErrors?.message) return NextResponse.json({ ok: false, errors: removed.userErrors }, { status: 400 });

  if (removed?.cart.totalQuantity && removed?.cart.totalQuantity <= 0) {
    jar.delete(CART_COOKIE)
  }

  return NextResponse.json({ ok: true, cart: removed?.cart });
}