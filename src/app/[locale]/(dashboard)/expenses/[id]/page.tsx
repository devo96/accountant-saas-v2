import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpenseViewClient } from "./client";

export default async function ExpenseViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.expense.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      lines: { include: { account: true, taxCode: true } },
      vendor: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/expenses");

  const expense = {
    ...raw,
    date: raw.date.toISOString(),
    amount: Number(raw.amount),
    taxAmount: Number(raw.taxAmount),
    lines: raw.lines.map((l) => ({
      ...l,
      amount: Number(l.amount),
      taxRate: Number(l.taxRate),
      taxAmount: Number(l.taxAmount),
      account: { ...l.account, balance: Number(l.account.balance) },
      taxCode: l.taxCode ? { ...l.taxCode, rate: Number(l.taxCode.rate) } : null,
    })),
  } as unknown as {
    id: string; number: number; date: string; category: string | null;
    description: string; amount: number; taxAmount: number;
    vendor: { name: string } | null; vendorId: string | null;
    paymentMethod: string; receipt: string | null; notes: string | null;
    organizationId: string; createdById: string;
    createdAt: Date; updatedAt: Date;
    createdBy: { name: string };
    lines: { id: string; amount: number; account: { code: string; name: string };
      taxCode: { name: string; rate: number } | null; taxRate: number; taxAmount: number; description: string | null }[];
  };

  return <ExpenseViewClient expense={expense} />;
}
