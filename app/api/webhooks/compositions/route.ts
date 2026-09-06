import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'crypto';

const TAG = '[/api/webhooks/compositions]';
const CACHE_TAG = 'compositions';

type CompositionWebhookPayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  schema?: string;
  record?: { slug?: string } | null;
  old_record?: { slug?: string } | null;
};

function verifySecret(header: string | null): boolean {
  const secret = process.env.INTERNAL_SUPABASE_WEBHOOK_SECRET;
  // No secret configured → allow through (dev convenience; set it in prod).
  if (!secret) return true;
  if (!header) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(header));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  console.info(`${TAG} received`);

  if (!verifySecret(req.headers.get('x-webhook-secret'))) {
    console.error(`${TAG} unauthorized — bad or missing x-webhook-secret`);
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let payload: CompositionWebhookPayload = {};
  try {
    payload = (await req.json()) as CompositionWebhookPayload;
  } catch {
    console.error(`${TAG} invalid JSON body`);
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = payload.record?.slug ?? payload.old_record?.slug ?? null;
  console.info(`${TAG} authorized`, { event: payload.type ?? 'unknown', slug });

  revalidateTag(CACHE_TAG, 'max');
  console.info(`${TAG} revalidated tag`, { tag: CACHE_TAG });

  return NextResponse.json({ ok: true, revalidated: true });
}
