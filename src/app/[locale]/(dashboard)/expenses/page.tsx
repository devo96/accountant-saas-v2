import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpensesClient } from "./client";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawExpenses = await prisma.expense.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "desc" },
    include: { lines: { include: { account: { select: { name: true, nameAr: true, code: true } } } } },
  });
  const expenses = rawExpenses.map((e) => ({ ...e, amount: Number(e.amount), lines: e.lines.map((l) => ({ ...l, amount: Number(l.amount) })) }));
  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, type: "EXPENSE", isMaster: false },
    select: { id: true, code: true, name: true, nameAr: true },
  });
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, nameAr: true },
    orderBy: { name: "asc" },
  });

  return <ExpensesClient expenses={expenses} accounts={accounts} vendors={vendors} />;
}
