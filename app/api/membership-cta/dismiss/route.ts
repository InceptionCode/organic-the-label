import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  MEMBERSHIP_CTA_DISMISSED,
  MEMBERSHIP_CTA_COOKIE_PATH,
} from '@/lib/membership-cta/constants';

export async function POST(): Promise<NextResponse<{ ok: boolean }>> {
  const jar = await cookies();

  jar.set(MEMBERSHIP_CTA_DISMISSED, '1', {
    path: MEMBERSHIP_CTA_COOKIE_PATH,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  return NextResponse.json({ ok: true });
}
