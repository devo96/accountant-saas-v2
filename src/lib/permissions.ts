export { getDefaultPermissions, hasPermission, hasRole } from "./permissions-shared";
export type { Role } from "./permissions-shared";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { hasPermission, hasRole } from "./permissions-shared";
import type { Role } from "./permissions-shared";

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
