import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewExpenseClient from "./client";

export default async function NewExpensePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [accounts, vendors] = await Promise.all([
    prisma.account.findMany({
      where: { organizationId: session.user.organizationId, type: "EXPENSE", isMaster: false },
      select: { id: true, code: true, name: true },
    }),
    prisma.vendor.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewExpenseClient accounts={accounts} vendors={vendors} />;
}
