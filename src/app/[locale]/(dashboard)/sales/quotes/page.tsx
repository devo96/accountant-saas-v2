import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SalesQuotesClient from "./client";

export default async function SalesQuotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const quotes = await prisma.salesQuote.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  const data = quotes.map((q) => ({
    id: q.id,
    number: q.number,
    quoteDate: q.quoteDate.toISOString(),
    expiryDate: q.expiryDate?.toISOString() ?? null,
    status: q.status,
    total: Number(q.total),
    customerName: q.customer.name,
  }));

  return <SalesQuotesClient quotes={data} />;
}
