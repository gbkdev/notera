import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { Logo } from "@/components/site-header";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">Administrator sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Students don’t need an account. This page is for people who manage the library.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
