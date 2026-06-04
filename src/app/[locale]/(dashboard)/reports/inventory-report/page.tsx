import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Building2, CircleDollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function InventoryReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const orgId = session.user.organizationId;

  const [items, warehouses] = await Promise.all([
    prisma.item.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameAr: true, sku: true, currentStock: true, costPrice: true, unit: true },
    }),
    prisma.warehouse.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalItems = items.length;
  const totalWarehouses = warehouses.length;
  const totalStockValue = items.reduce((s, i) => s + Number(i.currentStock) * Number(i.costPrice), 0);

  const tnav = await getTranslations("nav");
  const tc = await getTranslations("common");

  return (
    <FadeIn>
      <PageHeader title={tnav("inventoryReport")} description="Stock summary across all warehouses" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Items</CardTitle>
            <Package className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tnav("warehouses")}</CardTitle>
            <Building2 className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarehouses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Stock Value</CardTitle>
            <CircleDollarSign className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>{tc("stock")}</TableHead>
              <TableHead>{tc("unit")}</TableHead>
              <TableHead>{tc("costPrice")}</TableHead>
              <TableHead>Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-gray-400" />
                    <span>No items found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-gray-500">{item.sku ?? "—"}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(Number(item.costPrice))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.currentStock) * Number(item.costPrice))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
