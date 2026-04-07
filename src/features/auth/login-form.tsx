"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import { type LoginInput, loginSchema } from "./schema";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    setResendMessage(null);
    setUnconfirmedEmail(null);

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setErrorMessage(error.message);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(values.email);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form autoComplete="on" className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="email">
          Email
        </label>
        <Input autoComplete="username" id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="mt-1 text-xs text-rose-400">{form.formState.errors.email.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="password">
          Password
        </label>
        <Input autoComplete="current-password" id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? <p className="mt-1 text-xs text-rose-400">{form.formState.errors.password.message}</p> : null}
      </div>
      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      {unconfirmedEmail ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <p>Email is not confirmed yet.</p>
          <Button
            className="mt-2"
            size="sm"
            type="button"
            variant="secondary"
            onClick={async () => {
              setResendMessage(null);
              const { error } = await supabase.auth.resend({
                type: "signup",
                email: unconfirmedEmail,
                options: {
                  emailRedirectTo: `${window.location.origin}/login`
                }
              });

              if (error) {
                setResendMessage(error.message);
                return;
              }

              setResendMessage("Confirmation email resent.");
            }}
          >
            Resend confirmation email
          </Button>
          {resendMessage ? <p className="mt-2 text-xs text-amber-100">{resendMessage}</p> : null}
        </div>
      ) : null}

      <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

