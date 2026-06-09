#!/usr/bin/env node
/**
 * agent-bus — CLI the agent team uses to talk to the Control Room.
 *
 * It posts to the deployed API (the shared "memory"/bus) using the shared
 * secret, so everything shows up live on the /agents page.
 *
 * Env:
 *   AGENT_BASE_URL  (default: https://accountant-saas-v2.vercel.app)
 *   AGENT_SECRET or CRON_SECRET  (read from env, else parsed from .env / .env.local)
 *
 * Usage:
 *   node scripts/agent-bus.mjs state
 *   node scripts/agent-bus.mjs inbox [sinceISO]
 *   node scripts/agent-bus.mjs msg <author> <type> "content"      [--mention]
 *   node scripts/agent-bus.mjs task-add <assignee> <etaMin> "title" ["desc"]
 *   node scripts/agent-bus.mjs task-set <taskId> <STATUS>
 *   node scripts/agent-bus.mjs status <memberKey> <STATUS> ["current task"]
 *
 *   author/memberKey: manager | backend | frontend | tester | ux
 *   msg type:        CHAT | STATUS | HANDOFF | QUESTION | ANSWER
 *   task STATUS:     TODO | IN_PROGRESS | NEEDS_USER | BLOCKED | DONE
 *   member STATUS:   IDLE | WORKING | BLOCKED | WAITING_USER | DONE
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fromEnvFiles(key) {
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(ROOT, f), "utf8");
      const m = txt.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* ignore */ }
  }
  return undefined;
}

const BASE = (process.env.AGENT_BASE_URL || (process.argv.includes("--local") ? "http://localhost:3000" : "https://accountant-saas-v2.vercel.app")).replace(/\/$/, "");
const SECRET = process.env.AGENT_SECRET || process.env.CRON_SECRET || fromEnvFiles("AGENT_SECRET") || fromEnvFiles("CRON_SECRET");

if (!SECRET) {
  console.error("Missing AGENT_SECRET/CRON_SECRET (env or .env).");
  process.exit(1);
}

async function api(path, method = "GET", body) {
  const res = await fetch(`${BASE}/api/agents/${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) { console.error(`HTTP ${res.status}:`, json); process.exit(1); }
  return json;
}

const [, , cmd, ...a] = process.argv;
const args = a.filter((x) => !x.startsWith("--"));
const mention = a.includes("--mention");

const out = (x) => console.log(typeof x === "string" ? x : JSON.stringify(x, null, 2));

switch (cmd) {
  case "state": out(await api("state")); break;
  case "inbox": out(await api(`inbox${args[0] ? `?since=${encodeURIComponent(args[0])}` : ""}`)); break;
  case "msg":
    out(await api("messages", "POST", { author: args[0], type: args[1] || "CHAT", content: args.slice(2).join(" "), mentionsUser: mention }));
    break;
  case "task-add":
    out(await api("tasks", "POST", { assignee: args[0], etaMinutes: Number(args[1]) || null, title: args[2], description: args[3] || null }));
    break;
  case "task-set":
    out(await api("tasks", "PATCH", { id: args[0], status: args[1] }));
    break;
  case "status":
    out(await api("members", "PATCH", { key: args[0], status: args[1], currentTask: args[2] ?? undefined }));
    break;
  default:
    console.error("Unknown command. See header of scripts/agent-bus.mjs for usage.");
    process.exit(1);
}
