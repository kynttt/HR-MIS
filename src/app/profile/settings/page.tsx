import { redirect } from "next/navigation";
import { KeyRound, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/features/auth/service";
import { updatePasswordAction, updateProfileDetailsAction } from "@/features/profile/actions";
import { getCurrentUserProfileSettings } from "@/features/profile/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SEX_OPTIONS = ["male", "female", "prefer_not_to_say"] as const;
const CIVIL_STATUS_OPTIONS = ["single", "married", "widowed", "separated"] as const;

function getQueryString(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function ProfileSettingsPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile/settings");
  }

  const query = await searchParams;
  const successMessage = getQueryString(query.success);
  const errorMessage = getQueryString(query.error);

  const email = user.email?.trim().toLowerCase() ?? "";
  const settings = await getCurrentUserProfileSettings(user.id, email);

  const hasKnownSex = settings.sex ? SEX_OPTIONS.includes(settings.sex as (typeof SEX_OPTIONS)[number]) : true;
  const hasKnownCivilStatus = settings.civil_status ? CIVIL_STATUS_OPTIONS.includes(settings.civil_status as (typeof CIVIL_STATUS_OPTIONS)[number]) : true;

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</div>
      ) : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <section className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)] lg:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[#d8e2f4] bg-[#f4f8ff] p-2 text-[#4358d2]">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#071b33]">Profile Details</h2>
              <p className="mt-1 text-sm text-[#4a617d]">Update your account details and applicant contact information.</p>
            </div>
          </div>

          <form action={updateProfileDetailsAction} className="mt-5 space-y-4">
            <input type="hidden" name="return_to" value="/profile/settings" />
            <input type="hidden" name="has_applicant_profile" value={settings.has_applicant_profile ? "1" : "0"} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="full_name">
                  Full Name
                </label>
                <Input id="full_name" name="full_name" defaultValue={settings.full_name} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="email_readonly">
                  Account Email
                </label>
                <Input id="email_readonly" value={settings.email} readOnly />
              </div>
            </div>

            {settings.has_applicant_profile ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="first_name">
                      First Name
                    </label>
                    <Input id="first_name" name="first_name" defaultValue={settings.first_name} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="middle_name">
                      Middle Name
                    </label>
                    <Input id="middle_name" name="middle_name" defaultValue={settings.middle_name} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="last_name">
                      Last Name
                    </label>
                    <Input id="last_name" name="last_name" defaultValue={settings.last_name} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="suffix">
                      Suffix
                    </label>
                    <Input id="suffix" name="suffix" defaultValue={settings.suffix} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="phone">
                      Phone
                    </label>
                    <Input id="phone" name="phone" defaultValue={settings.phone} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="birth_date">
                      Birth Date
                    </label>
                    <Input id="birth_date" name="birth_date" type="date" defaultValue={settings.birth_date} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="sex">
                      Sex
                    </label>
                    <Select id="sex" name="sex" defaultValue={settings.sex || ""}>
                      <option value="">Prefer not to say</option>
                      {SEX_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.replaceAll("_", " ")}
                        </option>
                      ))}
                      {!hasKnownSex && settings.sex ? <option value={settings.sex}>{settings.sex}</option> : null}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="civil_status">
                      Civil Status
                    </label>
                    <Select id="civil_status" name="civil_status" defaultValue={settings.civil_status || ""}>
                      <option value="">Not specified</option>
                      {CIVIL_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.replaceAll("_", " ")}
                        </option>
                      ))}
                      {!hasKnownCivilStatus && settings.civil_status ? <option value={settings.civil_status}>{settings.civil_status}</option> : null}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="address">
                    Address
                  </label>
                  <Textarea id="address" name="address" defaultValue={settings.address} />
                </div>
              </>
            ) : (
              <p className="rounded-md border border-[#d7e2f3] bg-[#f8fbff] px-3 py-2 text-sm text-[#5e7490]">
                Applicant-specific details will be available here after your first application submission.
              </p>
            )}

            <Button type="submit">Save profile details</Button>
          </form>
        </section>

        <section className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)] lg:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[#d8e2f4] bg-[#f4f8ff] p-2 text-[#4358d2]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#071b33]">Security</h2>
              <p className="mt-1 text-sm text-[#4a617d]">Change your password for account protection.</p>
            </div>
          </div>

          <form action={updatePasswordAction} className="mt-5 space-y-4">
            <input type="hidden" name="return_to" value="/profile/settings" />
            <div>
              <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="new_password">
                New Password
              </label>
              <Input id="new_password" name="new_password" type="password" minLength={8} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#31465f]" htmlFor="confirm_password">
                Confirm New Password
              </label>
              <Input id="confirm_password" name="confirm_password" type="password" minLength={8} required />
            </div>
            <Button type="submit" variant="secondary">
              Update password
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
