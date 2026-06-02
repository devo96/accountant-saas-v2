import { prisma } from "./prisma";

export type NotificationEvent = {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
};

export async function createNotification(data: NotificationEvent) {
  const notifications = await Promise.all(
    data.userIds.map((userId) =>
      prisma.notification.create({
        data: {
          organizationId: "", // filled below
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          entityType: data.entityType ?? null,
          entityId: data.entityId ?? null,
          link: data.link ?? null,
        },
      })
    )
  );
  return notifications;
}

export async function notifyOrganization(
  organizationId: string,
  data: Omit<NotificationEvent, "userIds">
) {
  const users = await prisma.user.findMany({
    where: { organizationId, active: true },
    select: { id: true },
  });
  return createNotification({ ...data, userIds: users.map((u) => u.id) });
}
