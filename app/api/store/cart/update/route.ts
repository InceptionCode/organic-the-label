import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/store/cart-cookie";
import { shopifyServerClient } from "@/lib/Shopify/shopify-server-client";
import { CART_LINES_UPDATE_MUTATION, CartLinesUpdateResponse, type CartState } from "@/lib/Shopify/mutations";

type UpdateBody = { lineId: string; quantity?: number };

export async function POST(req: Request): Promise<NextResponse<CartState>> {
  const isDev = process.env.NODE_ENV === 'development';
  const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

  const shopifyClient = shopifyServerClient(productEndpoint)

  const { lineId, quantity = 1 } = (await req.json()) as UpdateBody;

  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value ?? null;

  const line = { id: lineId, quantity };

  if (!cartId) {
    // No cart to update (cookie missing/expired) — nothing to do, not an error.
    return NextResponse.json({ ok: true, cart: null });
  }

  const { data, errors } = await shopifyClient.request<CartLinesUpdateResponse>(CART_LINES_UPDATE_MUTATION, {
    variables: { cartId, lines: [line] },
  });

  if (errors?.networkStatusCode) {
    console.error('errors', errors);
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }

  const added = data?.cartLinesUpdate;
  if (added?.userErrors?.message) return NextResponse.json({ ok: false, errors: added.userErrors }, { status: 400 });

  // Cart was already converted/expired — clear the stale cookie so the next
  // add-to-cart starts a fresh cart instead of repeating this failure.
  if (!added?.cart) {
    const res = NextResponse.json({ ok: true, cart: null });
    res.cookies.delete(CART_COOKIE);
    return res;
  }

  return NextResponse.json({ ok: true, cart: added.cart });
}