# Kerala World

A playable, stylized Kerala-inspired 3D driving world for desktop and mobile browsers.

## Play

Desktop: WASD to drive or walk, E to enter/exit a nearby car, Space to brake/jump, drag to look, P for phone, M for map, T for chat.

Mobile: hold the arrow buttons to move/steer; use Brake/Jump and Enter/Exit. Drag the scenery with another finger to look. Map, Phone, and Chat buttons work without a keyboard. Landscape gives more space. Graphics resolution and shadows are reduced automatically on touch devices.

## Run locally

Requires Node.js 22 or newer. Run `npm ci`, then start `npm run backend` in one terminal and `npm run dev` in another. Open http://localhost:3000.

## Deploy

Frontend: import this repository into Vercel using the Next.js preset. `vercel.json` supplies the install/build commands.

Backend: create one free Node web service on Render, using `node --check backend/server.mjs` to build and `node backend/server.mjs` to start. Health check: `/health`. `render.yaml` contains the equivalent Blueprint.

Set `RENDER_BACKEND_URL` on Vercel to the backend HTTPS origin, or set `backendUrl` in `deployment.json` and redeploy. The Vercel API forwards traffic to Render; it never stores multiplayer state locally.

Tests: `npm test`, `npm run typecheck`, `npm run build`.

## Prototype limits

The world is a small artistic interpretation of Kerala, not a geographic replica. Graphics are procedural and stylized. Phone apps include map/fast travel, world chat, vehicle paint/summon, screenshot camera, generated ambient radio tones and settings. No real calls, combat, Minecraft building, or persistent accounts are implemented.

Up to 64 sessions are supported in one backend process; that capacity has not been load-tested. Player/chat state is temporary and resets on backend restart. Free Render services sleep while idle and may take time to reconnect. Session tokens prevent other players from overwriting an active player's state, but this is not a competitive anti-cheat system. Chat is public to connected players and is not actively moderated.
