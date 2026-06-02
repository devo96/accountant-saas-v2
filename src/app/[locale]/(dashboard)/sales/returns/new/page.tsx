import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewSalesReturnClient from "./client";

export default async function NewSalesReturnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const customers = await prisma.customer.findMany({
    where: { organizationId: session.user.organizationId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <NewSalesReturnClient customers={customers} />;
}
