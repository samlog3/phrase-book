"use client";
import { SignupForm } from "@/components/signup-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import type { FormEvent } from "react";

export default function Page() {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    if (error) {
      console.log(error);
      return;
    }
    router.push("/");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
