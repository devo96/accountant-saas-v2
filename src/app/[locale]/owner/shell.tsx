"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Building2, Package, Users, CreditCard, Shield, Ticket, PanelLeftClose, PanelLeft, Crown, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { key: "overview", href: "/owner", icon: LayoutDashboard },
  { key: "organizations", href: "/owner/organizations", icon: Building2 },
  { key: "plans", href: "/owner/plans", icon: Package },
  { key: "users", href: "/owner/users", icon: Users },
  { key: "payments", href: "/owner/payments", icon: CreditCard },
  { key: "billing", href: "/owner/billing", icon: CreditCard },
  { key: "security", href: "/owner/security", icon: Shield },
  { key: "support", href: "/owner/support", icon: Ticket },
];

export function OwnerShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const ot = useTranslations("ownerPanel");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>
      <aside className={cn(
        "w-64 border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300 md:relative z-50",
        sidebarOpen ? "fixed inset-y-0 right-0 translate-x-0" : "hidden md:flex",
        !desktopOpen && "md:-translate-x-full md:w-0 md:min-w-0 md:border-l-0"
      )}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">{t("owner")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.key} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600" : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-gray-500">
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-600">{session?.user?.name?.[0] ?? "U"}</span>
            </div>
            <span className="truncate">{session?.user?.email}</span>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:text-gray-700">
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => setDesktopOpen(!desktopOpen)} className="hidden md:flex p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              {desktopOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-primary-600 transition-colors">{ot("backToApp")}</Link>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
