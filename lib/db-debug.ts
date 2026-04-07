import { supabase } from "@/lib/supabase-client";

/**
 * Debugging helper - checks if database schema is properly set up
 */
export async function checkDatabaseSetup() {
  try {
    const { user } = (await supabase.auth.getUser()).data ?? {};
    if (!user) {
      console.warn("❌ Not authenticated");
      return;
    }

    // Try to fetch with user_id filter
    const { data, error } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (error?.message?.includes("column") || error?.message?.includes("user_id")) {
      console.error("❌ SCHEMA ISSUE: user_id column doesn't exist!");
      console.error("   Run the SQL migration in Supabase dashboard first");
      return { schemaUpdateNeeded: true, error: error.message };
    }

    if (error) {
      console.error("❌ Query error:", error.message);
      return { error: error.message };
    }

    console.log("✅ Database schema looks good!");
    console.log(`   Found ${data?.length ?? 0} habit entries for user`);
    return { ok: true };
  } catch (err) {
    console.error("❌ Setup check failed:", err);
  }
}
