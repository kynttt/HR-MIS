import { redirect } from "next/navigation";

import { getAuthenticatedHomePath, getCurrentUser } from "@/features/auth/service";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) {
    const destination = await getAuthenticatedHomePath();
    redirect(destination);
  }

  return <div className="page-enter">{children}</div>;
}
