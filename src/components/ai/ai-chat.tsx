"use client";

import { useState, useRef, useMemo, useCallback, useEffect, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Send, ImageUp, Loader2, Bot, User, CheckCircle2, XCircle, FileText, Receipt } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string; id: string };

type DraftInfo = {
  id: string;
  actionType: string;
  summary: string;
  payload: any;
  createdAt: string;
  expiresAt?: string;
};

export function AiChat() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const [approvedDraftIds, setApprovedDraftIds] = useState<string[]>([]);
  const [rejectedDraftIds, setRejectedDraftIds] = useState<string[]>([]);
  const [processingDraft, setProcessingDraft] = useState<string | null>(null);
  const [draftToMessage, setDraftToMessage] = useState<Record<string, string>>({});
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestPendingDraftId = useMemo(() => {
    const resolved = drafts.filter(d => !approvedDraftIds.includes(d.id) && !rejectedDraftIds.includes(d.id));
    if (resolved.length === 0) return null;
    return resolved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].id;
  }, [drafts, approvedDraftIds, rejectedDraftIds]);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/drafts/pending");
      if (!res.ok) return;
      const data = await res.json();
      setDrafts((prev) => {
        const approved = prev.filter((d) => approvedDraftIds.includes(d.id));
        const incoming = (data.drafts || []).filter((d: DraftInfo) => !approvedDraftIds.includes(d.id));
        return [...approved, ...incoming];
      });

      const incomingDrafts = data.drafts || [];
      if (incomingDrafts.length > 0) {
        const lastAssistantId = messagesRef.current.filter(m => m.role === "assistant").pop()?.id;
        if (lastAssistantId) {
          setDraftToMessage((prev) => {
            const next = { ...prev };
            for (const d of incomingDrafts) {
              if (!next[d.id]) next[d.id] = lastAssistantId;
            }
            return next;
          });
        }
      }
    } catch {}
  }, [approvedDraftIds]);

  const handleDraftAction = useCallback(async (draftId: string, action: "approve" | "reject") => {
    if (processingDraft) return;
    setProcessingDraft(draftId);
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`Draft ${action} failed:`, err);
        return;
      }
      if (action === "approve") {
        setApprovedDraftIds((prev) => [...prev, draftId]);
        const msg = locale === "ar"
          ? "تم اعتماد القيد بنجاح وتحديث دفاتر المنشأة."
          : "Journal entry approved and posted to your accounts successfully!";
        setMessages((prev) => [...prev, { role: "assistant", id: crypto.randomUUID(), content: msg }]);
      } else {
        setRejectedDraftIds((prev) => [...prev, draftId]);
        const msg = locale === "ar" ? "🗑️ تم إلغاء المسودة." : "🗑️ Draft cancelled.";
        setMessages((prev) => [...prev, { role: "assistant", id: crypto.randomUUID(), content: msg }]);
      }
    } catch (e) {
      console.error("Draft action error:", e);
    }
    setProcessingDraft(null);
  }, [locale, processingDraft]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) fetchDrafts();
  }, [isLoading, messages.length, fetchDrafts]);

  const sendMessage = useCallback(async (content: string | { type: "text" | "image"; text?: string; image?: string }[]) => {
    const userMsg: Message = { role: "user", id: crypto.randomUUID(), content: typeof content === "string" ? content : JSON.stringify(content) };
    const assistantMsg: Message = { role: "assistant", id: crypto.randomUUID(), content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    scrollDown();

    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content }] }) });

      if (res.status === 429) {
        const err = await res.json();
        setMessages((prev) => { const next = [...prev]; next[next.length - 1].content = err.error || "لقد تجاوزت الحد المسموح به."; return next; });
        setIsLoading(false); return;
      }

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setMessages((prev) => { const next = [...prev]; if (next[next.length - 1]?.role === "assistant") next[next.length - 1].content += chunk; return next; });
          scrollDown();
        }
      }
    } catch {
      setMessages((prev) => { const next = [...prev]; next[next.length - 1].content = locale === "ar" ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, something went wrong."; return next; });
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

  function onSubmit(e: FormEvent) { e.preventDefault(); if (!input.trim() || isLoading) return; const text = input; setInput(""); sendMessage(text); }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label={t("aiOpen")}
        className="fixed bottom-6 end-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95">
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 end-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[680px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white shrink-0">
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
            <div className="max-w-[85%] space-y-2">
              <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary-600 text-white whitespace-pre-wrap" : "bg-gray-100 text-gray-800 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pr-4 [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:pr-4 [&_li]:mb-0 [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:overflow-x-auto [&_p]:mb-1 [&_p:last-child]:mb-0"}`}>
                {m.role === "assistant" ? (
                  m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : (isLoading && m === messages[messages.length - 1] ? "..." : "")
                ) : (
                  m.content || ""
                )}
              </div>

              {m.role === "assistant" && drafts
                .filter(d => draftToMessage[d.id] === m.id)
                .filter(d => approvedDraftIds.includes(d.id) || rejectedDraftIds.includes(d.id) || d.id === latestPendingDraftId)
                .map((draft) => {
                const isApproved = approvedDraftIds.includes(draft.id);
                const isRejected = rejectedDraftIds.includes(draft.id);
                const isProcessing = processingDraft === draft.id;
                let borderStyle: string, bgStyle: string, textStyle: string;
                let badge: React.ReactNode;
                if (isApproved) {
                  borderStyle = "border-emerald-200"; bgStyle = "bg-emerald-50"; textStyle = "text-emerald-700";
                  badge = <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {locale === "ar" ? "تم الاعتماد بنجاح" : "Approved"}</span>;
                } else if (isRejected) {
                  borderStyle = "border-gray-200"; bgStyle = "bg-gray-50"; textStyle = "text-gray-500";
                  badge = <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{locale === "ar" ? "تم الإلغاء" : "Cancelled"}</span>;
                } else {
                  borderStyle = "border-amber-200"; bgStyle = "bg-amber-50"; textStyle = "text-amber-700";
                  badge = <span className="text-xs bg-amber-200 px-2 py-0.5 rounded-full">{locale === "ar" ? "بانتظار الموافقة" : "Pending Approval"}</span>;
                }
                return (
                <div key={draft.id} className={`rounded-xl p-4 space-y-3 ${borderStyle} ${bgStyle}`} dir="rtl">
                  <div className={`flex items-center gap-2 ${textStyle}`}>
                    {draft.actionType === "JOURNAL_ENTRY" ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                    <span className="font-semibold text-sm">{locale === "ar" ? "مسودة قيد محاسبي" : "Journal Entry Draft"}</span>
                    {badge}
                  </div>
                  <p className="text-sm text-gray-700">{draft.summary}</p>
                  {!isApproved && !isRejected && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDraftAction(draft.id, "approve")} disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {isProcessing ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "موافقة واعتماد" : "Confirm & Approve")}
                    </button>
                    <button onClick={() => handleDraftAction(draft.id, "reject")} disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50">
                      <XCircle className="h-4 w-4" />
                      {locale === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-gray-200 p-3 flex items-center gap-2 shrink-0">
        <input type="file" accept="image/*" ref={fileRef} onChange={onImageUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={isLoading} aria-label={t("aiUploadImage")}
          className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
          <ImageUp className="h-5 w-5" />
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("aiPlaceholder")}
          className="flex-1 min-w-0 border-0 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30" dir="auto" disabled={isLoading} />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label={t("aiSend")}
          className="shrink-0 p-2 text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
