import { AppShell } from "@/components/layout/app-shell";
import { requireAdminRole } from "@/features/auth/service";
import { ADMIN_ROLES } from "@/lib/utils/constants";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireAdminRole(ADMIN_ROLES);

  return <AppShell role={role}>{children}</AppShell>;
}