import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalesQuoteViewClient } from "./client";

export default async function SalesQuoteViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.salesQuote.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: { select: { name: true, email: true } },
      lines: { include: { item: { select: { name: true } }, taxCode: { select: { name: true, rate: true } } } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/sales/quotes");

  const quote = {
    ...raw,
    subtotal: Number(raw.subtotal),
    discountAmount: Number(raw.discountAmount),
    taxAmount: Number(raw.taxAmount),
    total: Number(raw.total),
    lines: raw.lines.map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
      discountPercent: Number(l.discountPercent),
      taxRate: Number(l.taxRate),
    })),
  };

  return <SalesQuoteViewClient quote={quote as any} />;
}
