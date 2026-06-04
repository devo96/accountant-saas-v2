import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdvancesClient } from "./client";

export default async function AdvancesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const advances = await prisma.advance.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { id: true, name: true } } },
  });

  return <AdvancesClient advances={advances.map((a) => ({ ...a, amount: Number(a.amount), repaidAmount: Number(a.repaidAmount) }))} />;
}
