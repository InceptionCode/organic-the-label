import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/store/cart-cookie";
import { shopifyServerClient } from "@/lib/Shopify/shopify-server-client";
import { CART_LINES_ADD_MUTATION, type CartLinesAddResponse, type CartState } from "@/lib/Shopify/mutations";

type AddBody = { variantId: string; quantity?: number };

export async function POST(req: Request): Promise<NextResponse<CartState>> {
  const isDev = process.env.NODE_ENV === 'development';
  const productEndpoint = isDev ? process.env.SHOPIFY_DEV_STORE_DOMAIN : process.env.SHOPIFY_PROD_STORE_DOMAIN;

  const shopifyClient = shopifyServerClient(productEndpoint)

  const { variantId, quantity = 1 } = (await req.json()) as AddBody;

  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value ?? null;

  const line = { merchandiseId: variantId, quantity };

  if (!cartId) {
    console.error("Cart does not exist!")

    throw new Error("Cart could not be updated")
  }

  const { data, errors } = await shopifyClient.request<CartLinesAddResponse>(CART_LINES_ADD_MUTATION, {
    variables: { cartId, lines: [line] },
  });

  if (errors?.networkStatusCode) return NextResponse.json({ ok: false, errors }, { status: 500 });

  const added = data?.cartLinesAdd;
  if (added?.userErrors?.message) return NextResponse.json({ ok: false, errors: added.userErrors }, { status: 400 });

  return NextResponse.json({ ok: true, cart: added?.cart });
}