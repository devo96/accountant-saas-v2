import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PayrollClient } from "./client";

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawRuns = await prisma.payrollRun.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });
  const runs = rawRuns.map((r) => ({
    ...r,
    totalSalaries: Number(r.totalSalaries),
    totalGosi: Number(r.totalGosi),
    netTotal: Number(r.netTotal),
  }));

  return <PayrollClient runs={runs} />;
}
