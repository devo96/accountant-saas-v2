import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeductionsClient } from "./client";

export default async function DeductionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const deductions = await prisma.deduction.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { id: true, name: true } } },
  });

  return <DeductionsClient deductions={deductions.map((d) => ({ ...d, amount: Number(d.amount) }))} />;
}
