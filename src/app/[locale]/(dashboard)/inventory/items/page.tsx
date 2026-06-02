import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ItemsClient } from "./client";

export default async function ItemsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const items = (await prisma.item.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  })).map((i) => ({ ...i, sellingPrice: Number(i.sellingPrice), costPrice: Number(i.costPrice) }));

  return <ItemsClient items={items} />;
}
