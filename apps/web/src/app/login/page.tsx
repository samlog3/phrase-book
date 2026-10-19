"use client";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

export default function Page() {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      console.log(error);
      return;
    }
    router.push("/");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
