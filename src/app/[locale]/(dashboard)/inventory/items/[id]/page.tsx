import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { ItemDetailClient } from "./client";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.item.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!raw) notFound();

  const item = {
    ...raw,
    sellingPrice: Number(raw.sellingPrice),
    costPrice: Number(raw.costPrice),
  } as unknown as {
    id: string; name: string; sku: string | null;
    barcode: string | null; type: string; unit: string; currentStock: number;
    minStock: number; sellingPrice: number; costPrice: number;
    description: string | null; active: boolean; createdAt: Date; updatedAt: Date; organizationId: string;
  };

  return <ItemDetailClient item={item} />;
}
