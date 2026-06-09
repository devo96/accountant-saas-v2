"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Receipt, Banknote, Package, BookOpen, BarChart3,
  Users, Settings, ChevronDown, ChevronLeft, FileText, UserCircle, Building2, Warehouse, Wallet,
  PiggyBank, Calculator, FileSpreadsheet, Calendar, Layout, Activity, QrCode, Mail, Upload,
  Handshake, ArrowRightLeft, ShieldCheck, HandCoins, Truck,
  ClipboardList, FolderTree, Ruler, BriefcaseBusiness, CircleDollarSign,
  Network, Search, Bot,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeft } from "lucide-react";

type NavChild = { key: string; href: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };
type NavItem = { key: string; href?: string; icon: React.ComponentType<{ className?: string }>; children?: NavChild[]; adminOnly?: boolean };

const navItems: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "agents",
    href: "/agents",
    icon: Bot,
    adminOnly: true,
  },
  {
    key: "sales",
    icon: ShoppingCart,
    children: [
      { key: "invoices", href: "/sales/invoices", icon: FileText },
      { key: "quotes", href: "/sales/quotes", icon: FileText },
      { key: "recurring", href: "/sales/recurring", icon: Calendar },
      { key: "customerReceipts", href: "/sales/customer-receipts", icon: HandCoins },
      { key: "salesReturns", href: "/sales/returns", icon: FileText },
      { key: "customers", href: "/sales/customers", icon: UserCircle },
    ],
  },
  {
    key: "purchases",
    icon: ShoppingBag,
    children: [
      { key: "purchaseInvoices", href: "/purchases/invoices", icon: FileText },
      { key: "simpleInvoices", href: "/purchases/simple-invoices", icon: Receipt },
      { key: "purchaseOrders", href: "/purchases/orders", icon: FileSpreadsheet },
      { key: "supplierPayments", href: "/purchases/supplier-payments", icon: Handshake },
      { key: "purchaseReturns", href: "/purchases/returns", icon: FileText },
      { key: "vendors", href: "/purchases/vendors", icon: Building2 },
    ],
  },
  {
    key: "products",
    icon: Package,
    children: [
      { key: "items", href: "/inventory/items", icon: Package },
      { key: "inventoryDashboard", href: "/inventory/dashboard", icon: ClipboardList },
      { key: "warehouses", href: "/inventory/warehouses", icon: Warehouse },
      { key: "stockMovements", href: "/inventory/stock-movements", icon: ArrowRightLeft },
      { key: "adjustments", href: "/inventory/adjustments", icon: Calculator },
      { key: "categories", href: "/inventory/categories", icon: FolderTree },
      { key: "units", href: "/inventory/units", icon: Ruler },
    ],
  },
  {
    key: "expenses",
    href: "/expenses",
    icon: Banknote,
  },
  {
    key: "banking",
    icon: Wallet,
    children: [
      { key: "bankAccounts", href: "/banking/accounts", icon: PiggyBank },
      { key: "bankTransactions", href: "/banking/transactions", icon: Receipt },
      { key: "paymentReceipts", href: "/banking/payment-receipts", icon: Receipt },
      { key: "reconciliation", href: "/banking/reconciliation", icon: Calculator },
    ],
  },
  {
    key: "accounting",
    icon: BookOpen,
    children: [
      { key: "chartOfAccounts", href: "/accounting/chart-of-accounts", icon: BarChart3 },
      { key: "journalEntries", href: "/accounting/journal-entries", icon: FileSpreadsheet },
      { key: "easyEntries", href: "/accounting/easy-entries", icon: FileSpreadsheet },
      { key: "openingBalances", href: "/accounting/opening-balances", icon: Calculator },
      { key: "generalLedger", href: "/accounting/general-ledger", icon: BookOpen },
      { key: "accountingDimensions", href: "/settings/accounting-dimensions", icon: Layout },
      { key: "costCenters", href: "/settings/cost-centers", icon: Network },
      { key: "currencies", href: "/settings/currencies", icon: Wallet },
      { key: "fiscalYears", href: "/settings/fiscal-years", icon: Calendar },
      { key: "accountingQuality", href: "/accounting/accounting-quality", icon: ShieldCheck },
    ],
  },
  {
    key: "fixedAssets",
    icon: Building2,
    children: [
      { key: "fixedAssetsList", href: "/accounting/fixed-assets", icon: Building2 },
      { key: "depreciation", href: "/accounting/fixed-assets/depreciation", icon: Calculator },
      { key: "disposals", href: "/accounting/fixed-assets/disposals", icon: ArrowRightLeft },
      { key: "assetTransfer", href: "/accounting/fixed-assets/asset-transfer", icon: Truck },
    ],
  },
  {
    key: "payroll",
    icon: Users,
    children: [
      { key: "payrollRuns", href: "/payroll", icon: FileText },
      { key: "employees", href: "/payroll/employees", icon: Users },
      { key: "advances", href: "/payroll/advances", icon: CircleDollarSign },
      { key: "deductions", href: "/payroll/deductions", icon: Calculator },
      { key: "socialInsurance", href: "/payroll/social-insurance", icon: ShieldCheck },
    ],
  },
  {
    key: "reports",
    icon: BarChart3,
    children: [
      { key: "reportsDashboard", href: "/reports", icon: BarChart3 },
      { key: "balanceSheet", href: "/reports/balance-sheet", icon: FileText },
      { key: "incomeStatement", href: "/reports/income-statement", icon: FileText },
      { key: "cashFlow", href: "/reports/cash-flow", icon: FileText },
      { key: "trialBalance", href: "/reports/trial-balance", icon: FileText },
      { key: "arAging", href: "/reports/ar-aging", icon: FileText },
      { key: "apAging", href: "/reports/ap-aging", icon: FileText },
      { key: "salesReport", href: "/reports/sales-report", icon: FileText },
      { key: "purchaseReport", href: "/reports/purchase-report", icon: FileText },
      { key: "expenseReport", href: "/reports/expense-report", icon: FileText },
      { key: "taxReport", href: "/reports/tax-report", icon: FileText },
      { key: "vatReturn", href: "/reports/vat-return", icon: FileText },
      { key: "inventoryReport", href: "/reports/inventory-report", icon: FileText },
      { key: "budgets", href: "/budgets", icon: Calculator },
    ],
  },
  {
    key: "tasks",
    icon: ClipboardList,
    children: [
      { key: "projects", href: "/projects", icon: BriefcaseBusiness },
      { key: "tasksList", href: "/tasks", icon: ClipboardList },
    ],
  },
  {
    key: "settings",
    icon: Settings,
    children: [
      { key: "organization", href: "/settings/organization", icon: Building2 },
      { key: "users", href: "/settings/users", icon: Users, adminOnly: true },
      { key: "taxCodes", href: "/settings/tax-codes", icon: Receipt },
      { key: "paymentTerms", href: "/settings/payment-terms", icon: Handshake },
      { key: "branches", href: "/settings/branches", icon: Building2 },
      { key: "emailTemplates", href: "/settings/email-templates", icon: Mail },
      { key: "import", href: "/settings/import", icon: Upload },
      { key: "zatca", href: "/settings/zatca", icon: QrCode },
      { key: "bookmarklet", href: "/settings/bookmarklet", icon: Search },
      { key: "auditLogs", href: "/settings/audit-logs", icon: Activity, adminOnly: true },
    ],
  },
];

export function Sidebar({ show, onClose, desktopOpen, onToggleDesktop }: { show?: boolean; onClose?: () => void; desktopOpen?: boolean; onToggleDesktop?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "VIEWER";
  const [expanded, setExpanded] = useState<string[]>(() => {
    const item = navItems.find(
      (item) =>
        item.children?.some((child) => pathname.startsWith(child.href)) ||
        item.href === pathname
    );
    return item?.key ? [item.key] : [];
  });

  const isAdmin = role === "ADMIN" || role === "OWNER";

  const filteredNavItems = navItems
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter((child) => !child.adminOnly || isAdmin);
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      if (item.adminOnly && !isAdmin) return null;
      return item;
    })
    .filter(Boolean) as NavItem[];

  function toggle(key: string) {
    setExpanded((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <button
        onClick={onToggleDesktop}
        className="fixed top-3 z-50 p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hidden md:flex items-center justify-center"
        style={{ insetInlineStart: desktopOpen ? "calc(var(--sidebar-width) + 8px)" : "8px" }}
        title={desktopOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {desktopOpen ? <PanelLeftClose className="h-4 w-4 text-gray-500" /> : <PanelLeft className="h-4 w-4 text-gray-500" />}
      </button>
      <aside
        className={cn(
          "w-[var(--sidebar-width)] border-e border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden transition-all duration-300 md:relative",
          show ? "fixed inset-y-0 start-0 z-50 translate-x-0" : "hidden md:flex",
          !desktopOpen && "md:-translate-x-full md:w-0 md:min-w-0 md:border-e-0"
        )}
      >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-200 dark:border-gray-700">
        <div className="h-9 w-9 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">ق</span>
        </div>
        <span className="font-bold text-base text-primary-600 dark:text-primary-300 whitespace-nowrap">{t("app.name")}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filteredNavItems.map((item) => {
          const isActive = item.href
            ? pathname === item.href
            : item.children?.some((c) => pathname.startsWith(c.href));
          const isExpanded = expanded.includes(item.key);

          if (item.children) {
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                    isActive
                      ? "bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-s-2 border-primary-600 dark:border-primary-500"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-right">{t(item.key)}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  )}
                </button>
                {isExpanded && (
                  <div className="me-4 space-y-0.5 mt-0.5">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                            isChildActive
                              ? "bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-s-2 border-primary-600 dark:border-primary-500"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{t(child.key)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href!}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                  isActive
                      ? "bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-s-2 border-primary-600 dark:border-primary-500"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
    </>
  );
}