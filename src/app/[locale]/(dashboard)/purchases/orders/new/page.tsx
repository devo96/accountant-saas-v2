import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewPurchaseOrderClient from "./client";

export default async function NewPurchaseOrderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, nameAr: true },
    orderBy: { name: "asc" },
  });

  return <NewPurchaseOrderClient vendors={vendors} />;
}
