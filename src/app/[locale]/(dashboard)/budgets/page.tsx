import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BudgetsClient } from "./client";

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const fiscalYears = await prisma.fiscalYear.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { startDate: "desc" },
  });

  return <BudgetsClient fiscalYears={fiscalYears.map((fy) => ({ id: fy.id, name: fy.name, startDate: fy.startDate.toISOString(), endDate: fy.endDate.toISOString() }))} />;
}
