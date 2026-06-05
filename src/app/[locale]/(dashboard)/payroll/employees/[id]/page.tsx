import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { EmployeeDetailClient } from "./client";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.employee.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!raw) notFound();

  const employee = {
    ...raw,
    basicSalary: Number(raw.basicSalary),
    allowances: Number(raw.allowances),
    gosiContribution: Number(raw.gosiContribution),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  } as unknown as {
    id: string; name: string; email: string | null;
    phone: string | null; position: string | null; basicSalary: number;
    allowances: number; gosiContribution: number; iqamaNumber: string | null;
    bankAccountNumber: string | null; active: boolean; organizationId: string;
    createdAt: string; updatedAt: string;
  };

  return <EmployeeDetailClient employee={employee} />;
}
