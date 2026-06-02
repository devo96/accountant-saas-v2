import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { BankAccountDetailClient } from "./client";

export default async function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.bankAccount.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!raw) notFound();

  const bankAccount = {
    ...raw,
    openingBalance: Number(raw.openingBalance),
    currentBalance: Number(raw.currentBalance),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  } as unknown as {
    id: string; name: string; nameAr: string | null; accountNumber: string | null;
    iban: string | null; bankName: string; currencyId: string | null;
    openingBalance: number; currentBalance: number; active: boolean;
    organizationId: string; createdAt: string; updatedAt: string;
  };

  return <BankAccountDetailClient bankAccount={bankAccount} />;
}
