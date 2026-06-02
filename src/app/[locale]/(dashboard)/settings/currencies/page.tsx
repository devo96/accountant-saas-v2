import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CurrenciesClient } from "./client";

export default async function CurrenciesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const currencies = await prisma.currency.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return <CurrenciesClient currencies={currencies.map((c) => ({ ...c, exchangeRate: Number(c.exchangeRate) }))} />;
}
