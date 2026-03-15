import { createSupabaseAdminClient } from "@/utils/supabase/base";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

/**
 * Fetches a user's profile from the public.profiles table.
 * Returns null if the profile does not exist.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch profile:", error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as Profile | null;
}
