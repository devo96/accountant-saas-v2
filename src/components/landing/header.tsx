"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { key: "products", label: "المنتجات", href: "#products" },
  { key: "features", label: "المميزات", href: "#features" },
  { key: "pricing", label: "الباقات والأسعار", href: "#pricing" },
  { key: "integrations", label: "التكاملات", href: "#integrations" },
  { key: "faq", label: "الأسئلة الشائعة", href: "#faq" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-primary-600">قيود</span>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a key={link.key} href={link.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">{link.label}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a href="/ar/login" className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">تسجيل الدخول</a>
            <a href="/ar/register" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">ابدأ تجربتك المجانية</a>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <a key={link.key} href={link.href} onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-primary-600">{link.label}</a>
            ))}
            <a href="/ar/login" className="block py-2 text-sm font-medium text-gray-700">تسجيل الدخول</a>
          </div>
        </div>
      )}
    </header>
  );
}
