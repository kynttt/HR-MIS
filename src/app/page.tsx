import { redirect } from "next/navigation";

import { getAuthenticatedHomePath, getCurrentUser } from "@/features/auth/service";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/apply");
  }

  const destination = await getAuthenticatedHomePath();
  redirect(destination);
}
