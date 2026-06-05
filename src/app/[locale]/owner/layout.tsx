import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { OwnerShell } from "./shell";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");
  return <Providers><OwnerShell>{children}</OwnerShell></Providers>;
}
