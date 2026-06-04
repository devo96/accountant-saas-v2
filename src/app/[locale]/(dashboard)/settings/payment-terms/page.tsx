import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentTermsClient } from "./client";

export default async function PaymentTermsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const terms = await prisma.paymentTerm.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return <PaymentTermsClient terms={terms.map((t) => ({ ...t, discountPercent: Number(t.discountPercent) }))} />;
}
