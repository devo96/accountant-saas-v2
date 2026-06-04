import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, FolderKanban } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "info" | "success" | "warning" | "danger" | "outline"> = {
  PLANNING: "info",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "outline",
  CANCELLED: "danger",
};

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const t = await getTranslations("projects");
  const orgId = session.user.organizationId;

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, manager: true },
  });

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <FadeIn>
      <PageHeader title={tnav("projects")} description={t("count", { count: projects.length })} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FolderKanban className="h-4 w-4" /> {t("totalProjects")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" /> {t("active")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t("completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
      </div>
      {projects.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{t("noProjects")}</h3>
            <p className="text-sm text-gray-500">{t("createProject")}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("manager")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("budget")}</TableHead>
                <TableHead>{t("progress")}</TableHead>
                <TableHead>{t("dates")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.customer?.name || "-"}</TableCell>
                  <TableCell>{p.manager?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] || "outline"} className="capitalize">
                      {p.status.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(p.budget))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {p.startDate ? formatDate(p.startDate) : "-"} {p.endDate ? `→ ${formatDate(p.endDate)}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
