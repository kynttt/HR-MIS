import Link from "next/link";
import { UserPlus2 } from "lucide-react";

import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e5edf5] bg-[#ffffff] p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-brand-100">
          <UserPlus2 className="h-3.5 w-3.5" />
          Registration
        </div>
        <h1 className="mt-3 font-display text-3xl font-medium text-[#061b31]">Create HRMIS Account</h1>
        <p className="mt-2 text-sm text-[#64748d]">Register your account. Admin approval and role assignment may be required.</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-sm text-[#64748d]">
          Already have access?{" "}
          <Link className="text-brand-700 transition-colors hover:text-brand-500" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


