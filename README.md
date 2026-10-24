# Triad Galaxy Board

Live galaxy board for the four-agent team: Lily, Misty, Friday and Chaya.
The center sun is the active server. Each agent is a planet on its own orbit.
Orbit dots are tasks in flight. Offline planets go grey and their orbit turns
dashed. There is no Friday-Chaya link, because Friday is bypass-only and not
on Tailscale.

## Deploy on Vercel (mobile friendly)

1. Open Vercel and choose **Add New > Project**.
2. **Import Git Repository** and select `triad-galaxy-board`.
3. Framework preset: **Other**. Build command: empty. Output directory: `.`
4. Deploy. Open the given link on any phone.

No build step is needed. The page is plain HTML, CSS and JavaScript.

## How the numbers stay live

The page reads `status.json` and refreshes it every 60 seconds.

- `server.active` is the server shown in the sun. Change it to
  `Bypass Relay (Cloudflare)` when the PC is off.
- Each agent has `online` (true/false), `queued` (tasks waiting on them),
  `today` (what they finished today) and `current` (what they are doing).
- `tasksInFlight` is how many glowing dots travel the orbits.
- Set an agent `online` to `false` and the planet goes grey, its orbit
  turns dashed, and the card shows offline.

Edit `status.json`, commit, and Vercel redeploys automatically.
