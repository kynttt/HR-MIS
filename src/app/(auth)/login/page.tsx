import Link from "next/link";
import { Database, FileCheck2, Shield } from "lucide-react";

import { LoginForm } from "@/features/auth/login-form";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const highlights = [
  { icon: Database, label: "Centralized recruitment records" },
  { icon: FileCheck2, label: "End-to-end applicant pipeline" },
  { icon: Shield, label: "Role-based access for admins" }
];

function getSafeNextPath(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (!value.startsWith("/") || value.startsWith("/login") || value.startsWith("/register")) {
    return undefined;
  }

  return value;
}

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const nextPath = getSafeNextPath(query.next);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f6f9fc] p-4 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
      <section className="hidden rounded-3xl border border-[#e5edf5] bg-gradient-to-b from-[#f8fbff] to-[#f8fbff] p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="code-label text-xs text-[#64748d]">University HRMIS</p>
          <h1 className="mt-4 max-w-md font-display text-5xl font-medium leading-[1.02] text-[#061b31]">Built for hiring teams that need clarity.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#273951]">
            Manage applications, job postings, departments, and employee records with a secure and streamlined admin workflow.
          </p>
        </div>
        <ul className="space-y-3">
          {highlights.map((item) => (
            <li key={item.label} className="flex items-center gap-3 rounded-xl border border-[#e5edf5] bg-[#f8fbff] px-4 py-3 text-sm text-[#273951]">
              <item.icon className="h-4 w-4 text-brand-500" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#e5edf5] bg-[#ffffff] p-6 sm:p-8">
          <p className="code-label text-xs text-[#64748d]">Account Access</p>
          <h2 className="mt-2 font-display text-3xl font-medium text-[#061b31]">Sign in to continue</h2>
          <p className="mt-2 text-sm text-[#64748d]">Use your account credentials to continue with applications or admin work.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-sm text-[#64748d]">
            Need an account?{" "}
            <Link className="text-brand-700 transition-colors hover:text-brand-500" href={nextPath ? { pathname: "/register", query: { next: nextPath } } : "/register"}>
              Create account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

