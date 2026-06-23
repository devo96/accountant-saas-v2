export { getDefaultPermissions, hasPermission, hasRole } from "./permissions-shared";
export type { Role } from "./permissions-shared";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { hasPermission, hasRole } from "./permissions-shared";
import type { Role } from "./permissions-shared";
import { prisma } from "./prisma";

export async function requirePermission(requiredPermission: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { authorized: false, session: null };
  }
  const userPermissions = (session.user as any).permissions as string[] | null;
  if (!hasPermission(session.user.role as Role, userPermissions, requiredPermission)) {
    return { authorized: false, session: null };
  }
  return { session, authorized: true };
}

export async function requireRole(requiredRole: Role) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { authorized: false, session: null };
  }
  if (!hasRole(session.user.role, requiredRole)) {
    return { authorized: false, session: null };
  }
  return { session, authorized: true };
}

/** Resource types that can have plan-imposed limits. */
type LimitType = "users" | "invoices" | "items";

/**
 * Check whether the organization has remaining quota for the given resource.
 * Returns an error response object if the limit is exceeded, or null if OK.
 */
export async function checkPlanLimit(
  organizationId: string,
  type: LimitType,
): Promise<{ limited: true; error: Response } | { limited: false }> {
  const orgPlan = await prisma.organizationPlan.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  if (!orgPlan || orgPlan.status === "EXPIRED" || orgPlan.status === "CANCELLED") {
    return { limited: false };
  }

  let max: number;
  let count: number;

  switch (type) {
    case "users": {
      max = orgPlan.plan.maxUsers;
      count = await prisma.user.count({ where: { organizationId } });
      break;
    }
    case "invoices": {
      max = orgPlan.plan.maxInvoices;
      const [sales, purchases] = await Promise.all([
        prisma.salesInvoice.count({ where: { organizationId } }),
        prisma.purchaseInvoice.count({ where: { organizationId } }),
      ]);
      count = sales + purchases;
      break;
    }
    case "items": {
      max = orgPlan.plan.maxItems;
      count = await prisma.item.count({ where: { organizationId } });
      break;
    }
  }

  if (count >= max) {
    return {
      limited: true,
      error: Response.json(
        { error: `Plan limit reached: max ${max} ${type}. Upgrade your plan to add more.` },
        { status: 403 },
      ),
    };
  }

  return { limited: false };
}
