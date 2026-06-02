import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TaxCodesClient } from "./client";

export default async function TaxCodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const taxCodes = await prisma.taxCode.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return <TaxCodesClient taxCodes={taxCodes.map((t) => ({ ...t, rate: Number(t.rate) }))} />;
}
