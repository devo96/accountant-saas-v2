import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeesClient } from "./client";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawEmployees = await prisma.employee.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });
  const employees = rawEmployees.map((e) => ({
    ...e,
    basicSalary: Number(e.basicSalary),
    allowances: Number(e.allowances),
    gosiContribution: Number(e.gosiContribution),
  }));

  return <EmployeesClient employees={employees} />;
}
