import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE_NAME, ANON_COOKIE_MAX_AGE } from "@/lib/constants";
import { generateAnonToken } from "@/lib/supabase/anon-token";
import { ensureAnonymousVisitor } from "@/lib/supabase/ensure-anon-visitor";

export async function POST() {
  const cookieStore = await cookies();
  let anonToken = cookieStore.get(ANON_COOKIE_NAME)?.value;

  if (!anonToken) {
    anonToken = generateAnonToken();
  }

  const visitor = await ensureAnonymousVisitor(anonToken);

  const response = NextResponse.json({
    ok: true,
    anonymousVisitorId: visitor.id,
  });

  response.cookies.set({
    name: ANON_COOKIE_NAME,
    value: anonToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANON_COOKIE_MAX_AGE,
  });

  return response;
}