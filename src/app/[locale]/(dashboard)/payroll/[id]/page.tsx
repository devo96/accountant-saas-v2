import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PayrollRunDetailClient } from "./client";

export default async function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.payrollRun.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!raw) notFound();

  const payrollRun = {
    ...raw,
    totalSalaries: Number(raw.totalSalaries),
    totalGosi: Number(raw.totalGosi),
    netTotal: Number(raw.netTotal),
    createdAt: raw.createdAt.toISOString(),
  } as unknown as {
    id: string; month: number; year: number; totalSalaries: number;
    totalGosi: number; netTotal: number; status: string;
    organizationId: string; createdById: string; createdAt: string;
  };

  return <PayrollRunDetailClient payrollRun={payrollRun} />;
}
