"use client";

export default function ProtectedError({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-500/10 p-6 text-sm text-rose-200">
      Failed to load the page: {error.message}
    </div>
  );
}