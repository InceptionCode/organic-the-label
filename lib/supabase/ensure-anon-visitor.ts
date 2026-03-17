import { createSupabaseAdminClient } from "../../utils/supabase/base";

export async function ensureAnonymousVisitor(anon_token: string): Promise<{
  id: string;
  anon_token: string;
}> {
  const supabase = await createSupabaseAdminClient();

  console.info("created client for ensuring anonToken", anon_token);

  const { data: existing, error: selectError } = await supabase
    .from("anonymous_visitors")
    .select("id, anon_token")
    .eq("anon_token", anon_token)
    .maybeSingle();

  if (selectError) {
    console.error("failed to query anonymous visitor", selectError);
    throw new Error(`Failed to query anonymous visitor: ${selectError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("anonymous_visitors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      console.error("failed to update anonymous visitor", updateError);
      throw new Error(`Failed to update anonymous visitor: ${updateError.message}`);
    }

    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("anonymous_visitors")
    .insert({
      anon_token,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .select("id, anon_token")
    .single();

  if (!insertError && created) {
    console.info("created anonymous visitor", created);
    return created;
  }

  console.info("failed to create anonymous visitor, checking for duplicates");

  const duplicateLike =
    insertError?.code === "23505" ||
    insertError?.message?.toLowerCase().includes("duplicate");

  if (duplicateLike) {
    const { data: afterConflict, error: retryError } = await supabase
      .from("anonymous_visitors")
      .select("id, anon_token")
      .eq("anon_token", anon_token)
      .single();

    if (retryError || !afterConflict) {
      console.error("anonymous visitor insert raced and retry lookup failed", retryError);
      throw new Error(
        `Anonymous visitor insert raced and retry lookup failed: ${retryError?.message ?? "unknown error"}`
      );
    }

    console.info("updating anonymous visitor", afterConflict);

    await supabase
      .from("anonymous_visitors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", afterConflict.id);

    return afterConflict;
  }

  console.error("failed to create anonymous visitor", insertError);
  throw new Error(`Failed to create anonymous visitor: ${insertError?.message ?? "unknown error"}`);
}