import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WarehousesClient } from "./client";

export default async function WarehousesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const orgId = session.user.organizationId;

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return <WarehousesClient data={warehouses} />;
}
