import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SalesReturnsClient from "./client";

export default async function SalesReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const returns = await prisma.salesReturn.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  const data = returns.map((r) => ({
    id: r.id,
    number: r.number,
    returnDate: r.returnDate.toISOString(),
    status: r.status,
    total: Number(r.total),
    customerName: r.customer?.name ?? "",
  }));

  return <SalesReturnsClient returns={data} />;
}
