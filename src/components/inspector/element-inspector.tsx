"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "@/i18n/navigation";
import { createPortal } from "react-dom";

type ElementInfo = {
  tag: string;
  text: string;
  id: string;
  classes: string;
  selector: string;
  href?: string;
  type?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export function ElementInspector() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<ElementInfo | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [modNote, setModNote] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!active) {
      setSelected(null);
      setHoveredEl(null);
      return;
    }

    const clickHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const el = e.target as HTMLElement;
      setSelected({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim()?.slice(0, 150) || "",
        id: el.id || "",
        classes: Array.from(el.classList).filter(c => !c.startsWith("_")).join("."),
        selector: buildSelector(el),
        href: (el as HTMLAnchorElement).href || undefined,
        type: (el as HTMLInputElement).type || undefined,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        ariaLabel: el.getAttribute("aria-label") || undefined,
      });
      setModNote("");
      setActive(false);
    };

    const hoverHandler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el !== hoveredEl) {
        setHoveredEl(el);
      }
    };

    document.addEventListener("click", clickHandler, true);
    document.addEventListener("mouseover", hoverHandler, true);
    return () => {
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("mouseover", hoverHandler, true);
    };
  }, [active, hoveredEl]);

  const close = () => {
    setSelected(null);
    setModNote("");
    setCopied(false);
  };

  const copyInfo = useCallback(() => {
    if (!selected) return;
    const text = `=== Element Inspector ===
Route: ${pathname}
Tag: ${selected.tag}
Text: ${selected.text}
ID: ${selected.id || "—"}
Classes: ${selected.classes || "—"}
Selector: ${selected.selector}
${selected.href ? `Href: ${selected.href}` : ""}
${selected.type ? `Input type: ${selected.type}` : ""}
${selected.placeholder ? `Placeholder: ${selected.placeholder}` : ""}
${selected.ariaLabel ? `AriaLabel: ${selected.ariaLabel}` : ""}
${modNote ? `\nModification note:\n${modNote}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selected, pathname, modNote]);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setActive(!active); }}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white text-lg font-bold transition-all duration-200 hover:scale-110"
        style={{
          backgroundColor: active ? "#ef4444" : "#7C3AED",
        }}
        title={active ? "إلغاء وضع التحديد" : "تفعيل وضع التحديد"}
      >
        {active ? "✕" : "✎"}
      </button>

      {active && (
        <div
          className="fixed inset-0 z-[9998] cursor-crosshair"
          style={{ outline: "3px dashed #ef4444", outlineOffset: "-3px", pointerEvents: "none" }}
        />
      )}

      {selected && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={close}
          dir="rtl"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                معلومات العنصر
              </h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <Row label="المسار" value={pathname} />
              <Row label="الوسم" value={`<${selected.tag}>`} />
              {selected.text && <Row label="النص" value={selected.text} />}
              {selected.id && <Row label="ID" value={selected.id} />}
              {selected.classes && <Row label="Classes" value={`.${selected.classes}`} />}
              <Row label="Selector" value={selected.selector} mono />
              {selected.href && <Row label="الرابط" value={selected.href} />}
              {selected.type && <Row label="Type" value={selected.type} />}
              {selected.placeholder && <Row label="Placeholder" value={selected.placeholder} />}
              {selected.ariaLabel && <Row label="Aria-label" value={selected.ariaLabel} />}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                صف التعديل المطلوب
              </label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="مثال: غير النص إلى ...، أضف زر جديد، غير اللون..."
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                dir="rtl"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyInfo}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                {copied ? "✓ تم النسخ!" : "نسخ المعلومات"}
              </button>
              <button
                onClick={close}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 dark:text-gray-400 min-w-[70px] shrink-0">{label}:</span>
      <span className={`text-gray-900 dark:text-gray-100 ${mono ? "font-mono text-xs break-all" : "break-words"}`}>
        {value}
      </span>
    </div>
  );
}

function buildSelector(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.body && parts.length < 6) {
    let seg = current.tagName.toLowerCase();
    if (current.id) {
      seg = `#${current.id}`;
      parts.unshift(seg);
      break;
    }
    const cls = Array.from(current.classList)
      .filter((c) => !c.startsWith("_") && c !== "css-1kc93gg" && c.length < 30)
      .slice(0, 2);
    if (cls.length) seg += `.${cls.join(".")}`;
    parts.unshift(seg);
    current = current.parentElement;
  }

  return parts.join(" > ");
}
