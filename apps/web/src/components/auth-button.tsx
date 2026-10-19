"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!data) {
    return (
      <div>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign up</Link>
      </div>
    );
  }

  return (
    <div>
      <p>{data.user.email}</p>
      <Button onClick={() => authClient.signOut()}>Logout</Button>
    </div>
  );
}
