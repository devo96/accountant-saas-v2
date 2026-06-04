import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectsClient } from "./client";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { id: true, name: true } }, manager: { select: { id: true, name: true } } },
  });

  return <ProjectsClient projects={projects.map((p) => ({ ...p, budget: Number(p.budget) }))} />;
}
