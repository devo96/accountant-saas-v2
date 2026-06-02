import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PurchaseReturnsClient from "./client";

export default async function PurchaseReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const returns = await prisma.purchaseReturn.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { name: true } } },
  });

  const data = returns.map((r) => ({
    id: r.id,
    number: r.number,
    returnDate: r.returnDate.toISOString(),
    status: r.status,
    total: Number(r.total),
    vendorName: r.vendor.name,
  }));

  return <PurchaseReturnsClient returns={data} />;
}
