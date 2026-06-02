import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseReturnViewClient } from "./client";

export default async function PurchaseReturnViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.purchaseReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      vendor: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/purchases/returns");

  const ret = {
    ...raw,
    total: Number(raw.total),
  };

  return <PurchaseReturnViewClient ret={ret as unknown as typeof ret} />;
}
