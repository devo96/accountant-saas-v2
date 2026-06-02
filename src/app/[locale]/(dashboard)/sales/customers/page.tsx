import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomersClient } from "./client";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const customers = (await prisma.customer.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  })).map((c) => ({ ...c, balance: Number(c.balance), creditLimit: Number(c.creditLimit) }));

  return <CustomersClient customers={customers} />;
}
