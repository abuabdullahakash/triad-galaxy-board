// Triad Galaxy Board — live status server (standalone Cloudflare Worker).
// This is a NEW worker. It does not touch or replace the team's existing
// message relay. Agents ping their live status here; the board polls it.
//
// Endpoints (all JSON):
//   GET  /live/status            -> { updated, server, agents: {lily, misty, friday, chaya} }
//   POST /live/ping              -> body { agent, online, queued, today, current }
//                                  header X-Live-Key must match the LIVE_KEY secret.
//   GET  /health                 -> { ok: true }
//
// Storage: Cloudflare KV namespace bound as STATUS.
//   key "agent:<name>" -> JSON record { online, queued, today, current, ts }
//   key "server"       -> JSON { active, fallback }
//
// Deploy (see README.md in this folder):
//   wrangler kv namespace create STATUS
//   wrangler secret put LIVE_KEY
//   wrangler deploy

const AGENTS = ["lily", "misty", "friday", "chaya"];

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Live-Key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return json({ ok: true });
    if (path === "/health") return json({ ok: true, service: "triad-live-status" });

    if (path === "/live/status" && request.method === "GET") {
      const agents = {};
      for (const name of AGENTS) {
        const raw = await env.STATUS.get("agent:" + name);
        agents[name] = raw ? JSON.parse(raw) : { online: false, queued: 0, today: "-", current: "no report yet", ts: "" };
      }
      const serverRaw = await env.STATUS.get("server");
      const server = serverRaw
        ? JSON.parse(serverRaw)
        : { active: "Live Server", fallback: "Bypass Relay" };
      return json({ updated: new Date().toISOString(), server, agents });
    }

    if (path === "/live/ping" && request.method === "POST") {
      if (!env.LIVE_KEY || request.headers.get("X-Live-Key") !== env.LIVE_KEY) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "bad json" }, 400);
      }
      if (!AGENTS.includes(body.agent)) return json({ ok: false, error: "bad agent" }, 400);
      const record = {
        online: body.online !== false,
        queued: Number(body.queued) || 0,
        today: String(body.today || "-"),
        current: String(body.current || "-"),
        ts: new Date().toISOString(),
      };
      await env.STATUS.put("agent:" + body.agent, JSON.stringify(record));
      if (body.serverActive) {
        await env.STATUS.put(
          "server",
          JSON.stringify({ active: String(body.serverActive), fallback: "Bypass Relay" })
        );
      }
      return json({ ok: true, agent: body.agent, ts: record.ts });
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};
