import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksClient } from "./client";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tasks = await prisma.task.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
  });

  return <TasksClient tasks={tasks.map((t) => ({ ...t, estimatedHours: Number(t.estimatedHours), actualHours: Number(t.actualHours) }))} />;
}
