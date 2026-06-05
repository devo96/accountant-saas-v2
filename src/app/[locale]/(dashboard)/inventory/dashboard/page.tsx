import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Building2, CircleDollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function InventoryDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const orgId = session.user.organizationId;

  const [totalItems, totalWarehouses, items, lowStockItems] = await Promise.all([
    prisma.item.count({ where: { organizationId: orgId, active: true } }),
    prisma.warehouse.count({ where: { organizationId: orgId, active: true } }),
    prisma.item.findMany({
      where: { organizationId: orgId, active: true },
      select: { currentStock: true, costPrice: true },
    }),
    prisma.item.findMany({
      where: { organizationId: orgId, active: true, currentStock: { lte: prisma.item.fields.minStock } },
      orderBy: { currentStock: "asc" },
      take: 10,
    }),
  ]);

  const totalStockValue = items.reduce((sum, i) => sum + Number(i.currentStock) * Number(i.costPrice), 0);
  const lowStockCount = lowStockItems.length;

  const tnav = await getTranslations("nav");
  const tc = await getTranslations("common");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("inventoryDashboard")}
        description={`${totalItems} ${tnav("items")} · ${totalWarehouses} ${tnav("warehouses")}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tnav("items")}</CardTitle>
            <Package className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">{tc("active")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tnav("warehouses")}</CardTitle>
            <Building2 className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarehouses}</div>
            <p className="text-xs text-gray-500 mt-1">{tc("active")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tc("total")}</CardTitle>
            <CircleDollarSign className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <p className="text-xs text-gray-500 mt-1">{tc("subtotal")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tc("status")}</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
            <p className="text-xs text-gray-500 mt-1">{tc("lowStock")}</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tc("lowStockItems")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc("name")}</TableHead>
                  <TableHead>{tc("stock")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>
                      <Badge variant="danger">{tc("lowStock")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </FadeIn>
  );
}
