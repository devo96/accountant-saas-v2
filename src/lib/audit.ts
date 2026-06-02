import { prisma } from "./prisma";

export async function createAuditLog(data: {
  organizationId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      oldValue: data.oldValue ?? undefined,
      newValue: data.newValue ?? undefined,
      ipAddress: data.ipAddress,
    },
  });
}
