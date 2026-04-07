import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/service";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <div className="page-enter">{children}</div>;
}
