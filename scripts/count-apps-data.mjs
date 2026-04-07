import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const tables = ["applicants", "job_openings", "applications"];
for (const t of tables) {
  const { count, error } = await supabase.from(t).select("id", { count: "exact", head: true });
  if (error) throw error;
  console.log(`${t}: ${count}`);
}
