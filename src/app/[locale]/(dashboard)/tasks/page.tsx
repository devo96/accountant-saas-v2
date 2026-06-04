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
import { ClipboardList, CheckSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

const priorityVariant: Record<string, "danger" | "warning" | "info" | "outline"> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "outline",
};

const statusVariant: Record<string, "outline" | "info" | "warning" | "success"> = {
  TODO: "outline",
  IN_PROGRESS: "info",
  REVIEW: "warning",
  DONE: "success",
};

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const t = await getTranslations("tasks");
  const orgId = session.user.organizationId;

  const tasks = await prisma.task.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { project: true, assignee: true },
  });

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const overdueCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length;

  return (
    <FadeIn>
      <PageHeader title={tnav("tasksList")} description={t("count", { count: tasks.length })} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t("todo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todoCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t("inProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t("completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{doneCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500">{t("overdue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>
      {tasks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{t("noTasks")}</h3>
            <p className="text-sm text-gray-500">{t("createTask")}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("titleColumn")}</TableHead>
                <TableHead>{t("projectColumn")}</TableHead>
                <TableHead>{t("assigneeColumn")}</TableHead>
                <TableHead>{t("dueDateColumn")}</TableHead>
                <TableHead>{t("priorityColumn")}</TableHead>
                <TableHead>{t("statusColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">{t.title}</TableCell>
                  <TableCell>{t.project?.name || "-"}</TableCell>
                  <TableCell>{t.assignee?.name || "-"}</TableCell>
                  <TableCell className="text-gray-500">{t.dueDate ? formatDate(t.dueDate) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant[t.priority] || "outline"} className="capitalize">
                      {t.priority.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status] || "outline"} className="capitalize">
                      {t.status.toLowerCase().replace(/_/g, " ")}
                    </Badge>
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
