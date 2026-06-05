import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewStockMovementClient from "./client";

export default async function NewStockMovementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [items, warehouses] = await Promise.all([
    prisma.item.findMany({
      where: { organizationId: session.user.organizationId, active: true },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({
      where: { organizationId: session.user.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewStockMovementClient items={items} warehouses={warehouses} />;
}
