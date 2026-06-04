import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GeneralLedgerClient from "./client";

export default async function GeneralLedgerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId: session.user.organizationId,
      status: "POSTED",
    },
    orderBy: { date: "desc" },
    include: {
      lines: {
        include: { account: true },
        orderBy: { id: "asc" },
      },
      createdBy: { select: { name: true } },
    },
  });

  const data = entries.map((e) => ({
    id: e.id,
    number: e.number,
    date: e.date.toISOString(),
    description: e.description,
    status: e.status,
    createdByName: e.createdBy?.name ?? "",
    lines: e.lines.map((l) => ({
      id: l.id,
      accountCode: l.account.code,
      accountName: l.account.name,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  }));

  return <GeneralLedgerClient entries={data} />;
}
