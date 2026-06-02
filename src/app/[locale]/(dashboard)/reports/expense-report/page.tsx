import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpenseReportClient } from "../client";

export default async function ExpenseReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.expense.findMany({
    where: { organizationId: session.user.organizationId },
    include: { lines: { include: { account: true } } },
    orderBy: { date: "desc" },
  });

  const expenses = raw.map((exp) => ({
    ...exp,
    amount: Number(exp.amount),
    taxAmount: Number(exp.taxAmount),
    lines: exp.lines.map((l) => ({ ...l, amount: Number(l.amount), taxAmount: Number(l.taxAmount), taxRate: Number(l.taxRate) })),
  }));

  return <ExpenseReportClient expenses={expenses} />;
}
