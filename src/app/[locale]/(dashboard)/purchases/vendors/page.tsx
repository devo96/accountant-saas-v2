import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VendorsClient } from "./client";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const vendors = (await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  })).map((v) => ({ ...v, balance: Number(v.balance) }));

  return <VendorsClient vendors={vendors} />;
}
