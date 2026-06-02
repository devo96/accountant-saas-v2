export type Role = "OWNER" | "ADMIN" | "ACCOUNTANT" | "VIEWER";

const roleHierarchy: Record<Role, number> = {
  VIEWER: 0,
  ACCOUNTANT: 1,
  ADMIN: 2,
  OWNER: 3,
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: ["*"],
  ADMIN: ["*"],
  ACCOUNTANT: [
    "sales.invoices.*",
    "sales.quotes.*",
    "sales.returns.*",
    "sales.customers.*",
    "purchases.invoices.*",
    "purchases.orders.*",
    "purchases.returns.*",
    "purchases.vendors.*",
    "expenses.*",
    "banking.*",
    "inventory.*",
    "accounting.*",
    "reports.*",
    "payroll.*",
    "settings.organization.*",
    "settings.currencies.*",
    "settings.tax-codes.*",
    "settings.zatca.*",
    "settings.import.*",
  ],
  VIEWER: [
    "sales.invoices.read",
    "sales.quotes.read",
    "sales.returns.read",
    "sales.customers.read",
    "purchases.invoices.read",
    "purchases.orders.read",
    "purchases.returns.read",
    "purchases.vendors.read",
    "expenses.read",
    "banking.read",
    "inventory.read",
    "accounting.read",
    "reports.*",
    "payroll.read",
    "settings.organization.read",
  ],
};

export function getDefaultPermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

function matchPermission(userPerm: string, required: string): boolean {
  if (userPerm === "*") return true;
  const userParts = userPerm.split(".");
  const reqParts = required.split(".");
  for (let i = 0; i < Math.max(userParts.length, reqParts.length); i++) {
    const u = userParts[i] ?? "*";
    const r = reqParts[i] ?? "*";
    if (u === "*" || r === "*") return true;
    if (u !== r) return false;
  }
  return true;
}

export function hasPermission(
  userRole: Role | undefined,
  userPermissions: string[] | null | undefined,
  requiredPermission: string
): boolean {
  const role = userRole ?? "VIEWER";
  if (role === "OWNER" || role === "ADMIN") return true;
  const perms = userPermissions ?? getDefaultPermissions(role);
  return perms.some((p) => matchPermission(p, requiredPermission));
}

export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = roleHierarchy[userRole as Role] ?? -1;
  return userLevel >= roleHierarchy[requiredRole];
}
