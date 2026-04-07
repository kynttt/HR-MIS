import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

for (const table of ["applicants", "job_openings", "employees"]) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) {
    console.error(table, error.message);
    process.exit(1);
  }
  console.log(`${table}: ${count}`);
}
