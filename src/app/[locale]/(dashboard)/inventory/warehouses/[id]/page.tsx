import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { WarehouseDetailClient } from "./client";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.warehouse.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!raw) notFound();

  const warehouse = {
    ...raw,
    createdAt: raw.createdAt.toISOString(),
  } as unknown as {
    id: string; name: string; address: string | null;
    active: boolean; organizationId: string; createdAt: string;
  };

  return <WarehouseDetailClient warehouse={warehouse} />;
}
