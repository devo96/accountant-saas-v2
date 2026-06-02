import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BankAccountsClient } from "./client";

export default async function BankAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const accounts = (await prisma.bankAccount.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  })).map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber ?? "", bankName: a.bankName, currentBalance: Number(a.currentBalance) }));

  return <BankAccountsClient accounts={accounts} />;
}
