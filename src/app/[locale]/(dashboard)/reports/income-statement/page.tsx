import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "../client";

export default async function IncomeStatementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, type: { in: ["INCOME", "EXPENSE"] } },
    orderBy: { code: "asc" },
  });
  const balances = accounts.map((a) => ({ ...a, calculatedBalance: Number(a.balance) }));

  return <ReportsClient accounts={balances} type="income-statement" />;
}
