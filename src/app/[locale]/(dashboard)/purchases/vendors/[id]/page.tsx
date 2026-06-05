import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { VendorDetailClient } from "./client";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.vendor.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      purchaseInvoices: {
        orderBy: { invoiceDate: "desc" },
        take: 20,
      },
    },
  });
  if (!raw) notFound();

  const vendor = {
    ...raw,
    balance: Number(raw.balance),
    purchaseInvoices: raw.purchaseInvoices.map((i) => ({
      ...i,
      invoiceDate: i.invoiceDate.toISOString(),
      total: Number(i.total),
    })),
  } as unknown as {
    id: string; name: string; email: string | null;
    phone: string | null; mobile: string | null; address: string | null;
    taxNumber: string | null; balance: number;
    active: boolean; createdAt: Date; updatedAt: Date; organizationId: string;
    purchaseInvoices: { id: string; number: number; invoiceDate: string; status: string; total: number }[];
  };

  return <VendorDetailClient vendor={vendor} />;
}
