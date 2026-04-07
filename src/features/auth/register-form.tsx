"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import { type RegisterInput, registerSchema } from "./schema";

export function RegisterForm() {
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRegisteredEmail(values.email);
    setMessage("Account created. Please check your email and click the confirmation link before login.");
  });

  return (
    <form autoComplete="on" className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="full_name">
          Full Name
        </label>
        <Input autoComplete="name" id="full_name" {...form.register("full_name")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="email">
          Email
        </label>
        <Input autoComplete="email" id="email" type="email" {...form.register("email")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="password">
          Password
        </label>
        <Input autoComplete="new-password" id="password" type="password" {...form.register("password")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]" htmlFor="confirm_password">
          Confirm Password
        </label>
        <Input autoComplete="new-password" id="confirm_password" type="password" {...form.register("confirm_password")} />
      </div>
      {message ? <p className="text-sm text-[#273951]">{message}</p> : null}
      <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      {registeredEmail ? (
        <Button
          className="w-full"
          type="button"
          variant="secondary"
          onClick={async () => {
            setMessage(null);
            const { error } = await supabase.auth.resend({
              type: "signup",
              email: registeredEmail,
              options: {
                emailRedirectTo: `${window.location.origin}/login`
              }
            });

            if (error) {
              setMessage(error.message);
              return;
            }

            setMessage("Confirmation email resent.");
          }}
        >
          Resend confirmation email
        </Button>
      ) : null}

      <p className="text-center text-sm text-[#64748d]">
        Already have an account?{" "}
        <Link className="text-brand-700 transition-colors hover:text-brand-500" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

