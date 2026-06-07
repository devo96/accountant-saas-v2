"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { AiChat } from "@/components/ai/ai-chat";
import { ElementInspector } from "@/components/inspector/element-inspector";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { ToastProvider } from "@/components/ui/toast";
import { useState, type ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = useState(true);

  return (
    <Providers>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
              <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} desktopOpen={sidebarDesktopOpen} onToggleDesktop={() => setSidebarDesktopOpen((v) => !v)} />
              <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <ImpersonationBanner />
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--color-bg)" }}>
                  <div className="p-3 md:p-4 animate-fade-in">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <AiChat />
            <ElementInspector />
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </Providers>
  );
}
