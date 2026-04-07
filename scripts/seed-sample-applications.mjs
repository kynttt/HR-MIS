import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const statuses = ["submitted", "under_review", "shortlisted", "interview_scheduled", "accepted", "rejected"];

const { data: applicants, error: aErr } = await supabase.from("applicants").select("id").order("created_at", { ascending: false });
if (aErr) throw aErr;

const { data: existingApps, error: exErr } = await supabase.from("applications").select("applicant_id");
if (exErr) throw exErr;

const existingApplicantIds = new Set((existingApps ?? []).map((x) => x.applicant_id));
const targetApplicants = (applicants ?? []).filter((a) => !existingApplicantIds.has(a.id)).slice(0, 20);

const { data: jobs, error: jErr } = await supabase.from("job_openings").select("id, status").order("created_at", { ascending: false });
if (jErr) throw jErr;

const openJobs = (jobs ?? []).filter((j) => j.status === "open");
const jobPool = openJobs.length > 0 ? openJobs : (jobs ?? []);
if (jobPool.length === 0) throw new Error("No job openings available to attach applications.");

const applications = targetApplicants.map((a, i) => ({
  id: randomUUID(),
  applicant_id: a.id,
  job_opening_id: jobPool[i % jobPool.length].id,
  status: statuses[i % statuses.length]
}));

if (applications.length === 0) {
  console.log("No eligible applicants without applications found. Nothing inserted.");
  process.exit(0);
}

const { error: insErr } = await supabase.from("applications").insert(applications);
if (insErr) throw insErr;

console.log(`Inserted applications: ${applications.length}`);
