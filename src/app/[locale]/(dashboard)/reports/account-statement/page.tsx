import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountStatementClient } from "./client";

export default async function AccountStatementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, active: true },
    orderBy: { code: "asc" },
  });

  return <AccountStatementClient accounts={accounts.map((a) => ({ ...a, balance: Number(a.balance) }))} />;
}
