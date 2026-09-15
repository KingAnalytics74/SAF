import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CurrentStaff = Database["public"]["Tables"]["staff"]["Row"];

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return staff;
}
