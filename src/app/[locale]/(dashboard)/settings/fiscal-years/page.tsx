import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FiscalYearsClient } from "./client";

export default async function FiscalYearsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const years = await prisma.fiscalYear.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { startDate: "desc" },
  });

  return <FiscalYearsClient years={years} />;
}
