import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-[#061b31]">Unauthorized</h1>
      <p className="mt-3 text-sm text-[#64748d]">Your account does not currently have access to this page.</p>
      <div className="mt-6">
        <Link href="/dashboard" className="rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
