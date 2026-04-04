import { createSupabaseAdminClient } from "@/utils/supabase/base";
import { mergeAnonymousVisitorIntoUser } from "@/lib/supabase/migrate-anon-user";

type BootstrapParams = {
  userId: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
};

export async function bootstrapAuthenticatedUser({
  userId,
  email,
  emailVerified,
  displayName
}: BootstrapParams) {
  const supabase = createSupabaseAdminClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: email ?? null,
        display_name: displayName ?? null,
      },
      {
        onConflict: "id",
      }
    );

  if (profileError) {
    console.error('profileError', profileError);
    throw new Error(`Failed to upsert profile: ${profileError.message}`);
  }

  const { error: preferencesError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
      },
      {
        onConflict: "user_id",
      }
    );

  if (preferencesError) {
    console.error('preferencesError', preferencesError);
    throw new Error(`Failed to upsert user preferences: ${preferencesError.message}`);
  }

  // Merge anonymous activity + claim guest entitlements
  await mergeAnonymousVisitorIntoUser({
    userId,
    email,
    emailVerified
  });
}