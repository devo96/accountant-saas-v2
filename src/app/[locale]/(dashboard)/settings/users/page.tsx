import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/permissions";
import { UsersSettingsClient, type User } from "./client";

export default async function UsersSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (!hasRole(session.user.role, "ADMIN")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, permissions: true },
    orderBy: { name: "asc" },
  });

  return <UsersSettingsClient users={users as unknown as User[]} currentUserId={session.user.id} />;
}
