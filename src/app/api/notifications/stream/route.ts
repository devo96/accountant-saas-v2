import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      async function poll() {
        while (!closed) {
          try {
            const notifications = await prisma.notification.findMany({
              where: { userId, read: false },
              orderBy: { createdAt: "desc" },
              take: 10,
            });
            const data = `data: ${JSON.stringify(notifications)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          } catch {
            // ignore
          }
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      poll();

      (controller as any).onCancel = () => {
        closed = true;
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
