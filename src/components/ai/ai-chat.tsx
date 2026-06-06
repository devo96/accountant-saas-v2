"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Send, ImageUp, Loader2, Bot, User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; id: string };

export function AiChat() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const sendMessage = useCallback(async (content: string | { type: "text" | "image"; text?: string; image?: string }[]) => {
    const userMsg: Message = {
      role: "user",
      id: crypto.randomUUID(),
      content: typeof content === "string" ? content : JSON.stringify(content),
    };
    const assistantMsg: Message = { role: "assistant", id: crypto.randomUUID(), content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    scrollDown();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") last.content += chunk;
            return next;
          });
          scrollDown();
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") last.content = locale === "ar" ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, something went wrong. Please try again.";
        return next;
      });
    }

    setIsLoading(false);
    scrollDown();
  }, [messages, locale]);

  function onImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const prompt = locale === "ar" ? "اقرأ هذه الفاتورة واقترح القيد المحاسبي المناسب" : "Read this invoice and suggest the appropriate journal entry";
      sendMessage([{ type: "text", text: prompt }, { type: "image", image: base64 }]);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage(text);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("aiOpen")}
        className="fixed bottom-6 end-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 end-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm">{t("aiAssistant")}</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label={t("aiClose")} className="p-1 rounded hover:bg-primary-500 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8 space-y-2">
            <Bot className="h-10 w-10 mx-auto text-primary-300" />
            <p>{t("aiEmptyTitle")}</p>
            <p className="text-xs text-gray-300">{t("aiEmptyHint")}</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-primary-100" : "bg-gray-100"}`}>
              {m.role === "user" ? <User className="h-4 w-4 text-primary-600" /> : <Bot className="h-4 w-4 text-gray-600" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-800"}`}>
              {m.content || (isLoading && m === messages[messages.length - 1] ? "..." : "")}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-gray-200 p-3 flex items-center gap-2">
        <input type="file" accept="image/*" ref={fileRef} onChange={onImageUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={isLoading} aria-label={t("aiUploadImage")} className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
          <ImageUp className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("aiPlaceholder")}
          className="flex-1 min-w-0 border-0 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
          dir="auto"
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label={t("aiSend")} className="shrink-0 p-2 text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
