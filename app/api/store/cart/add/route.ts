import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/store/cart-cookie";
import { shopifyServerClient } from "@/lib/Shopify/shopify-server-client";
import { CART_CREATE_MUTATION, CART_LINES_ADD_MUTATION, type CartCreateResponse, type CartLinesAddResponse, type CartState } from "@/lib/Shopify/mutations";

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
    const { data, errors } = await shopifyClient.request<CartCreateResponse>(CART_CREATE_MUTATION, {
      variables: { lines: [line] },
    });

    if (errors?.networkStatusCode || !data?.cartCreate) return NextResponse.json({ ok: false, errors }, { status: 500 });

    const created = data.cartCreate;
    if (created.userErrors?.message) return NextResponse.json({ ok: false, errors: created.userErrors }, { status: 400 });

    const cart = created.cart;
    const res = NextResponse.json({ ok: true, cart });

    res.cookies.set(CART_COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res;
  }

  console.error('Cart already exist or there was an issue creating the cart.')
  throw new Error('Could not create cart!')
}