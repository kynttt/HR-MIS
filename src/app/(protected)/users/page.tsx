import { requireAdminRole } from "@/features/auth/service";
import { listManagedUsers } from "@/features/users/service";
import type { ManagedUser } from "@/features/users/service";
import { UserManagementPanel } from "@/features/users/user-management-panel";
import { UserCog } from "lucide-react";

export default async function UsersPage() {
  await requireAdminRole(["super_admin"]);

  let users: ManagedUser[] = [];
  let error: string | null = null;

  try {
    users = await listManagedUsers();
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : "Failed to load users";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><UserCog className="h-6 w-6" />User Management</h2>
        <p className="text-sm text-[#64748d]">Super admin only. Create accounts and assign roles from UI.</p>
      </div>

      {error ? <p className="rounded-md border border-rose-200 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}

      <UserManagementPanel users={users} />
    </div>
  );
}



