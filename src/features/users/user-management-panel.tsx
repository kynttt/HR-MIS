"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { createManagedUserAction, inviteManagedUserAction, updateManagedUserRoleAction } from "./actions";
import { type CreateUserInput, type InviteUserInput, createUserSchema, inviteUserSchema } from "./schema";
import type { ManagedUser } from "./service";

export function UserManagementPanel({ users }: { users: ManagedUser[] }) {
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inviteForm = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "department_admin"
    }
  });

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "department_admin"
    }
  });

  const onInvite = inviteForm.handleSubmit((values) => {
    startTransition(async () => {
      setInviteMessage(null);
      const result = await inviteManagedUserAction(values);
      if (!result.ok) {
        setInviteMessage(result.error);
        return;
      }
      inviteForm.reset();
      setInviteMessage(result.message);
    });
  });

  const onCreateInstant = createForm.handleSubmit((values) => {
    startTransition(async () => {
      setCreateMessage(null);
      const result = await createManagedUserAction(values);
      if (!result.ok) {
        setCreateMessage(result.error);
        return;
      }
      createForm.reset();
      setCreateMessage(result.message);
    });
  });

  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4" onSubmit={onInvite}>
        <h3 className="text-lg font-semibold text-[#061b31]">Invite User (Recommended)</h3>
        <p className="text-sm text-[#64748d]">Sends a confirmation email link. Role is assigned immediately after invite.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Full name" {...inviteForm.register("full_name")} />
          <Input placeholder="Email" type="email" {...inviteForm.register("email")} />
          <Select {...inviteForm.register("role")}>
            <option value="super_admin">super_admin</option>
            <option value="hr_admin">hr_admin</option>
            <option value="department_admin">department_admin</option>
          </Select>
        </div>
        {inviteMessage ? <p className="text-sm text-[#273951]">{inviteMessage}</p> : null}
        <Button disabled={isPending} type="submit">{isPending ? "Sending invite..." : "Send Invite"}</Button>
      </form>

      <form className="grid gap-3 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4" onSubmit={onCreateInstant}>
        <h3 className="text-lg font-semibold text-[#061b31]">Create Instant Account</h3>
        <p className="text-sm text-[#64748d]">For internal setup. Account is email-confirmed immediately.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Full name" {...createForm.register("full_name")} />
          <Input placeholder="Email" type="email" {...createForm.register("email")} />
          <Input placeholder="Temporary password" type="password" {...createForm.register("password")} />
          <Select {...createForm.register("role")}>
            <option value="super_admin">super_admin</option>
            <option value="hr_admin">hr_admin</option>
            <option value="department_admin">department_admin</option>
          </Select>
        </div>
        {createMessage ? <p className="text-sm text-[#273951]">{createMessage}</p> : null}
        <Button disabled={isPending} type="submit">{isPending ? "Creating..." : "Create Instant User"}</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <table className="w-full text-sm">
          <thead className="bg-[#ffffff] text-left text-[#64748d]">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Email Confirmed</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-[#64748d]" colSpan={6}>No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow key={user.user_id} user={user} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: ManagedUser }) {
  const [role, setRole] = useState<"super_admin" | "hr_admin" | "department_admin">(user.role ?? "department_admin");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-t border-[#e5edf5]">
      <td className="px-3 py-2">{user.full_name ?? "-"}</td>
      <td className="px-3 py-2">{user.email}</td>
      <td className="px-3 py-2">
        <Select className="h-8" value={role} onChange={(event) => setRole(event.target.value as "super_admin" | "hr_admin" | "department_admin") }>
          <option value="super_admin">super_admin</option>
          <option value="hr_admin">hr_admin</option>
          <option value="department_admin">department_admin</option>
        </Select>
      </td>
      <td className="px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-3 py-2">{user.email_confirmed_at ? "Yes" : "No"}</td>
      <td className="px-3 py-2">
        <div className="space-y-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setMessage(null);
                const result = await updateManagedUserRoleAction({
                  user_id: user.user_id,
                  role
                });

                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }

                setMessage("Saved");
              });
            }}
            type="button"
          >
            Save Role
          </Button>
          {message ? <p className="text-xs text-[#64748d]">{message}</p> : null}
        </div>
      </td>
    </tr>
  );
}
