import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChartOfAccountsClient } from "./client";

export default async function ChartOfAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const accounts = (await prisma.account.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { code: "asc" },
  })).map((a) => ({ ...a, balance: Number(a.balance) }));
  const parentAccounts = accounts.filter((a) => a.isMaster);
  const currencies = await prisma.currency.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return <ChartOfAccountsClient accounts={accounts} parentAccounts={parentAccounts} currencies={currencies} />;
}
