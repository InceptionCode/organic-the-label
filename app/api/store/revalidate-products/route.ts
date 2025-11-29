// app/api/revalidate-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const productTable = isDev ? 'dev_products' : 'prod_products';

  const secret = req.headers.get('x-webhook-secret');

  if (secret !== process.env.INTERNAL_SUPABASE_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { affectedFilters } = body; // optional; for v1, ignore

  // v1: just nuke the generic "products" cache layer
  revalidateTag(productTable, 'max');

  return NextResponse.json({ revalidated: true });
}
