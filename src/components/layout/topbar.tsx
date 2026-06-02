"use client";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Globe, Search, X, Moon, Sun, Menu } from "lucide-react";
import { useState, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/components/notification-provider";
import { formatDate } from "@/lib/utils";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggle: toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  function toggleLocale() {
    const newLocale = pathname.startsWith("/ar") ? "en" : "ar";
    const newPath = pathname.replace(/^\/(ar|en)/, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[var(--topbar-height)]">
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden" title="Toggle menu">
          <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            className="w-36 md:w-64 rounded-lg border border-gray-200 dark:border-gray-600 py-1.5 pe-9 ps-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors duration-200"
            placeholder={t("common.search") ?? "Search..."}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
        </button>

        <button onClick={toggleLocale} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={t("common.switchLang")}>
          <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>

        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute end-0 mt-2 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("common.notifications") ?? "Notifications"}</span>
                <button onClick={() => setShowNotif(false)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">{t("common.noNotifications") ?? "No notifications"}</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm cursor-pointer transition-colors ${!n.read ? "bg-primary-50 dark:bg-primary-950/30" : ""}`}
                      onClick={() => { markRead(n.id); if (n.link) router.push(n.link); setShowNotif(false); }}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{n.title}</div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{n.message}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{formatDate(new Date(n.createdAt))}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DropdownMenu
          trigger={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <Avatar name={session?.user?.name ?? undefined} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{session?.user?.name}</span>
            </div>
          }
          items={[
            { label: "Sign out", icon: <LogOut className="h-4 w-4" />, onClick: () => signOut({ callbackUrl: "/en/login" }), variant: "danger" },
          ]}
        />
      </div>
    </header>
  );
}
