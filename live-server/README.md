# Triad Galaxy Board — live server deploy

This worker is the board's real live server. It stores each agent's latest
status in Cloudflare KV and serves it to the board. The board polls it every
20 seconds, so numbers change without any redeploy.

## Deploy (one time, free Cloudflare account)

From this folder:

1. `npx wrangler login` (approves the Cloudflare login in a browser)
2. `npx wrangler kv namespace create STATUS` and paste the id into
   `wrangler.toml`
3. `npx wrangler secret put LIVE_KEY` (pick any strong value, share it only
   with the four agents)
4. `npx wrangler deploy`

Note the worker URL, for example
`https://triad-live-status.<account>.workers.dev`.

## Connect the board

Put that URL into the board repo's `live.json`:

```json
{ "url": "https://triad-live-status.<account>.workers.dev" }
```

Commit it. The board then polls `<url>/live/status` every 20 seconds and
falls back to `status.json` if the live server is unreachable.

## How agents report

Each agent pings on its check-in (or whenever its state changes):

```
POST <url>/live/ping
X-Live-Key: <secret>
{ "agent": "misty", "online": true, "queued": 0,
  "today": "2 hunts, 37 screened", "current": "Autonomous outreach" }
```

Agents: `lily`, `misty`, `friday`, `chaya`. Optional field
`serverActive` updates the sun label, e.g. `"PC Relay (Tailscale)"` or
`"Bypass Relay (Cloudflare)"`.
