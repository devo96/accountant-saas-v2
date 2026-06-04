import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SocialInsuranceClient } from "./client";

export default async function SocialInsurancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const records = await prisma.socialInsuranceRecord.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { id: true, name: true } } },
  });

  return <SocialInsuranceClient records={records.map((r) => ({ ...r, employeeShare: Number(r.employeeShare), employerShare: Number(r.employerShare), totalContribution: Number(r.totalContribution), salary: Number(r.salary) }))} />;
}
