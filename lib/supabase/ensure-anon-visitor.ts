import { createSupabasePrivateClient } from "./base";

export async function ensureAnonymousVisitor(anon_token: string): Promise<{
  id: string;
  anon_token: string;
}> {
  const supabase = await createSupabasePrivateClient();

  console.log("created client for ensuring anonToken", anon_token);

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

  if (insertError || !created) {
    console.error("failed to create anonymous visitor", insertError);
    throw new Error(`Failed to create anonymous visitor: ${insertError?.message ?? "unknown error"}`);
  }

  console.log("created anonymous visitor", created);

  return created;
}