"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, RefreshCw, Bot, AlertCircle, Clock, CheckCircle2, Loader2, CircleDot } from "lucide-react";

type Member = { id: string; key: string; name: string; role: string; emoji: string; status: string; currentTask: string | null };
type Task = { id: string; title: string; description: string | null; assignee: string | null; status: string; etaMinutes: number | null; order: number; startedAt: string | null; completedAt: string | null };
type Message = { id: string; taskId: string | null; author: string; role: string | null; type: string; content: string; mentionsUser: boolean; answered: boolean; createdAt: string };
type Run = { id: string; title: string; goal: string | null; status: string };
type State = { run: Run; members: Member[]; tasks: Task[]; messages: Message[] };

const MEMBER_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  IDLE: { label: "خامل", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
  WORKING: { label: "يعمل الآن", cls: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300", dot: "bg-green-500 animate-pulse" },
  BLOCKED: { label: "متوقف", cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300", dot: "bg-red-500" },
  WAITING_USER: { label: "بانتظار ردّك", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", dot: "bg-amber-500 animate-pulse" },
  DONE: { label: "أنهى", cls: "bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300", dot: "bg-primary-500" },
};

const COLUMNS: { key: string; label: string; match: string[]; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
  { key: "TODO", label: "قيد الانتظار", match: ["TODO"], icon: CircleDot, tint: "text-gray-500" },
  { key: "IN_PROGRESS", label: "تنفيذ", match: ["IN_PROGRESS"], icon: Loader2, tint: "text-green-600" },
  { key: "NEEDS_USER", label: "يحتاج تدخّلك", match: ["NEEDS_USER", "BLOCKED"], icon: AlertCircle, tint: "text-amber-600" },
  { key: "DONE", label: "منجز", match: ["DONE"], icon: CheckCircle2, tint: "text-primary-600" },
];

function eta(min: number | null) {
  if (min == null) return null;
  if (min < 60) return `~${min} د`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `~${h}س ${m}د` : `~${h}س`;
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "الآن";
  if (d < 3600) return `قبل ${Math.floor(d / 60)} د`;
  if (d < 86400) return `قبل ${Math.floor(d / 3600)} س`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

function api(path: string) {
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "ar" : "ar";
  return `/${locale}${path}`;
}

export default function AgentsControlRoom() {
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(api("/api/agents/state"), { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 401 ? "يجب تسجيل الدخول" : "تعذّر التحميل");
      setState(await res.json());
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [state?.messages.length]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await fetch(api("/api/agents/messages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type: "CHAT" }),
      });
      setInput("");
      await load();
    } finally {
      setSending(false);
    }
  }

  const memberOf = (key: string) => state?.members.find((m) => m.key === key);
  const openMentions = (state?.messages || []).filter((m) => m.mentionsUser && !m.answered);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Bot className="h-6 w-6 text-primary-600" /> غرفة التحكم بالوكلاء
          </h1>
          {state?.run && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-semibold">{state.run.title}</span>
              {state.run.goal ? ` — ${state.run.goal}` : ""}
            </p>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </button>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">{err}</div>
      )}

      {/* Waiting-on-you banner */}
      {openMentions.length > 0 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-bold">وكيل ينتظر ردّك ({openMentions.length}):</span>{" "}
            {openMentions[openMentions.length - 1].content.slice(0, 160)}
            <div className="text-xs mt-1 opacity-80">اكتب ردّك في الدردشة بالأسفل ليكمل الفريق.</div>
          </div>
        </div>
      )}

      {/* Team members */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {(state?.members || []).map((m) => {
          const st = MEMBER_STATUS[m.status] || MEMBER_STATUS.IDLE;
          return (
            <div key={m.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{m.emoji}</span>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{m.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">{m.role}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                </span>
              </div>
              {m.currentTask && <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">▸ {m.currentTask}</div>}
            </div>
          );
        })}
      </div>

      {/* Board + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kanban */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          {COLUMNS.map((col) => {
            const tasks = (state?.tasks || []).filter((t) => col.match.includes(t.status));
            const Icon = col.icon;
            return (
              <div key={col.key} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-2 min-h-[120px]">
                <div className="flex items-center gap-1.5 px-1 pb-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <Icon className={`h-3.5 w-3.5 ${col.tint}`} /> {col.label}
                  <span className="ms-auto text-gray-400">{tasks.length}</span>
                </div>
                <div className="space-y-1.5">
                  {tasks.map((t) => {
                    const owner = t.assignee ? memberOf(t.assignee) : null;
                    return (
                      <div key={t.id} className={`rounded-lg bg-white dark:bg-gray-800 border p-2 ${t.status === "BLOCKED" ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-gray-700"}`}>
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">{t.title}</div>
                        {t.description && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description}</div>}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {owner && <span>{owner.emoji} {owner.name}</span>}
                          {eta(t.etaMinutes) && <span className="inline-flex items-center gap-0.5 ms-auto"><Clock className="h-3 w-3" />{eta(t.etaMinutes)}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {tasks.length === 0 && <div className="text-[11px] text-gray-400 px-1 py-2">لا مهام</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live chat */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-[520px]">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-800 dark:text-gray-100">الدردشة المباشرة مع الفريق</div>
          <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {(state?.messages || []).map((msg) => {
              const isUser = msg.author === "USER";
              const owner = memberOf(msg.author);
              const highlight = msg.mentionsUser && !msg.answered;
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${isUser ? "bg-primary-600 text-white" : highlight ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100" : "bg-gray-100 dark:bg-gray-700/60 text-gray-800 dark:text-gray-100"}`}>
                    {!isUser && (
                      <div className="font-bold mb-0.5 flex items-center gap-1">
                        {owner ? `${owner.emoji} ${owner.name}` : msg.author}
                        {msg.type === "HANDOFF" && <span className="text-[10px] font-normal opacity-70">· تسليم</span>}
                        {msg.type === "QUESTION" && <span className="text-[10px] font-normal opacity-70">· سؤال</span>}
                        {msg.type === "STATUS" && <span className="text-[10px] font-normal opacity-70">· حالة</span>}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className={`text-[10px] mt-0.5 ${isUser ? "text-white/70" : "opacity-60"}`}>{timeAgo(msg.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            {(!state || state.messages.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-8">لا رسائل بعد. سيظهر هنا تواصل الوكلاء.</div>
            )}
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="اكتب رسالتك للفريق…"
              className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 max-h-24"
            />
            <button onClick={send} disabled={sending || !input.trim()} className="rounded-lg bg-primary-600 text-white p-2 disabled:opacity-40 hover:bg-primary-700">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
