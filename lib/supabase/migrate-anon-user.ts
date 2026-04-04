// lib/auth/mergeAnonymousVisitorIntoUser.ts
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/utils/supabase/base";
import { ANON_COOKIE_NAME } from "@/lib/constants";

export async function mergeAnonymousVisitorIntoUser(params: {
  userId: string;
  email?: string | null;
  emailVerified?: boolean;
}) {
  const supabase = createSupabaseAdminClient();
  const cookieStore = await cookies();
  const anonToken = cookieStore.get(ANON_COOKIE_NAME)?.value;

  if (params.emailVerified && params.email) {
    console.log("claiming guest entitlements", params.email);

    const { error: entitlementError } = await supabase
      .from("entitlements")
      .update({
        user_id: params.userId,
      })
      .eq("purchaser_email", params.email)
      .is("user_id", null)
      .is("revoked_at", null);

    if (entitlementError) {
      console.error(`Failed to claim guest entitlements: ${entitlementError.message}`);
      throw new Error(`Failed to claim guest entitlements: ${entitlementError.message}`);
    }
  }

  if (!anonToken) {
    console.error("User is not anonymous or the anonymous token is missing");
    return;
  }


  console.log("finding anonymous visitor", anonToken);

  const { data: visitor, error: visitorError } = await supabase
    .from("anonymous_visitors")
    .select("id, claimed_by_user_id")
    .eq("anon_token", anonToken)
    .maybeSingle();

  if (visitorError) {
    console.error(`Failed to find anonymous visitor: ${visitorError.message}`);
    throw new Error(`Failed to find anonymous visitor: ${visitorError.message}`);
  }

  if (!visitor) {
    console.log("anonymous visitor not found");
    return;
  }

  // Reassign anon activity to the authenticated user
  console.log("reassigning anon activity to the authenticated user", params.userId);

  const { error: activityError } = await supabase
    .from("activity_events")
    .update({
      user_id: params.userId,
    })
    .eq("anonymous_visitor_id", visitor.id)
    .is("user_id", null);

  if (activityError) {
    console.error(`Failed to merge activity events: ${activityError.message}`);
    throw new Error(`Failed to merge activity events: ${activityError.message}`);
  }

  // Mark anon visitor as claimed
  console.log("marking anon visitor as claimed", params.userId);

  const { error: visitorUpdateError } = await supabase
    .from("anonymous_visitors")
    .update({
      claimed_by_user_id: params.userId,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", visitor.id);

  if (visitorUpdateError) {
    console.error(`Failed to mark visitor as claimed: ${visitorUpdateError.message}`);
    throw new Error(`Failed to mark visitor as claimed: ${visitorUpdateError.message}`);
  }
}