import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalesReturnViewClient } from "./client";

export default async function SalesReturnViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.salesReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/sales/returns");

  const ret = {
    ...raw,
    total: Number(raw.total),
  };

  return <SalesReturnViewClient ret={ret as unknown as typeof ret} />;
}
