import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewJournalEntryClient from "./client";

export default async function NewJournalEntryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [accounts, projects] = await Promise.all([
    prisma.account.findMany({
      where: { organizationId: session.user.organizationId, isMaster: false },
      select: { id: true, code: true, name: true },
    }),
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewJournalEntryClient accounts={accounts} projects={projects} />;
}
