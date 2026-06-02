import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { CustomerDetailClient } from "./client";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      salesInvoices: {
        orderBy: { invoiceDate: "desc" },
        take: 20,
      },
    },
  });
  if (!raw) notFound();

  const customer = {
    ...raw,
    balance: Number(raw.balance),
    creditLimit: Number(raw.creditLimit),
    salesInvoices: raw.salesInvoices.map((i) => ({
      ...i,
      invoiceDate: i.invoiceDate.toISOString(),
      total: Number(i.total),
    })),
  } as unknown as {
    id: string; name: string; nameAr: string | null; email: string | null;
    phone: string | null; mobile: string | null; address: string | null;
    taxNumber: string | null; creditLimit: number; balance: number;
    active: boolean; createdAt: Date; updatedAt: Date; organizationId: string;
    salesInvoices: { id: string; number: number; invoiceDate: string; status: string; total: number }[];
  };

  return <CustomerDetailClient customer={customer} />;
}
