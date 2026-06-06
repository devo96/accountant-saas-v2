"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ShoppingCart, Users, FileText, Calculator, Package,
  Wallet, Stamp, BarChart3, ScrollText, HelpCircle,
  Newspaper, ChevronDown, ArrowLeft, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ProductsMegaMenu() {
  const t = useTranslations("landing");
  const nav = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groups = [
    {
      title: nav("sales"),
      items: [
        { label: nav("invoices"), href: "#", icon: FileText },
        { label: nav("customers"), href: "#", icon: Users },
        { label: nav("quotes"), href: "#", icon: FileText },
        { label: nav("salesReturns"), href: "#", icon: ShoppingCart },
      ],
    },
    {
      title: nav("purchases"),
      items: [
        { label: nav("purchaseInvoices"), href: "#", icon: ShoppingCart },
        { label: nav("vendors"), href: "#", icon: Users },
        { label: nav("purchaseOrders"), href: "#", icon: ScrollText },
      ],
    },
    {
      title: nav("accounting"),
      items: [
        { label: nav("journalEntries"), href: "#", icon: Calculator },
        { label: nav("chartOfAccounts"), href: "#", icon: BarChart3 },
        { label: nav("balanceSheet"), href: "#", icon: FileText },
        { label: nav("incomeStatement"), href: "#", icon: BarChart3 },
      ],
    },
    {
      title: nav("products"),
      items: [
        { label: nav("items"), href: "#", icon: Package },
        { label: nav("warehouses"), href: "#", icon: Package },
        { label: nav("payroll"), href: "#", icon: Wallet },
        { label: nav("vatReturn"), href: "#", icon: Stamp },
      ],
    },
  ];

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("products")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors py-2"
      >
        {t("products")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full start-1/2 rtl:translate-x-1/2 -translate-x-1/2 z-50 mt-2 w-[600px] rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40 p-5"
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {groups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    {group.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50/60 rounded-lg transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-gray-400" />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link
                href="#products"
                className="flex items-center justify-between px-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50/60 rounded-lg transition-colors"
              >
                <span>{t("viewAllProducts")}</span>
                <ArrowLeft className="h-4 w-4 rtl:block ltr:hidden" />
                <ArrowRight className="h-4 w-4 ltr:block rtl:hidden" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ResourcesDropdown() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = [
    { label: t("faq"), href: "#faq", icon: HelpCircle },
    { label: t("blog"), href: "#", icon: Newspaper },
    { label: t("helpCenter"), href: "#", icon: HelpCircle },
  ];

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("resources")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors py-2"
      >
        {t("resources")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full end-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/40 py-1.5"
          >
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50/60 transition-colors"
              >
                <item.icon className="h-4 w-4 text-gray-400" />
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
