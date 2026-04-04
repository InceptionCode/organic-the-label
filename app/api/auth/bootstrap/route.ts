'use server'

import { NextResponse } from "next/server";
import { bootstrapAuthenticatedUser } from "@/lib/supabase/boostrap-authenticate-user";
import { fetchProfile } from "@/lib/supabase/fetch-profile";
import { createSupabaseServerClient } from "@/utils/supabase/server-base";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    console.error("No user found or error occurred", error);
    return NextResponse.json(
      {
        ok: false,
        message: `No user found or error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 400 }
    );
  }

  const profile = await fetchProfile(user.id);

  await bootstrapAuthenticatedUser({
    userId: user.id,
    email: user.email ?? undefined,
    displayName: profile?.display_name ?? user.user_metadata?.username ?? undefined,
    emailVerified: user.confirmed_at != null,
  });

  return NextResponse.json({ ok: true });
}