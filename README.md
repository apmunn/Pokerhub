# ♠ PokerHub

A responsive, browser-based **Texas Hold'em learning and solo practice app**. All chips are free virtual tokens with **no monetary value**, purchases, prizes, or cash-outs.

## What works

- **Solo poker table:** heads-up Texas Hold'em versus a basic computer opponent, rotating dealer/button, blinds, betting rounds, folding, calling, checking, raising, all-in, community cards, and five-card showdown evaluation
- **Academy:** 24 interactive lessons across poker basics, starting hands, postflop strategy, poker math, and advanced thinking
- **Daily challenge:** a calendar-based quiz with local XP progress
- **Hand Lab:** select private and community cards, evaluate the best five-card hand, and simulate approximate showdown equity versus a random opponent
- **Strategy coach:** topic explanations, pot-odds calculator, and hints from your current table
- **Solo Cup:** three-match local tournament challenge against computer opponents
- **Progress:** learning ranks, achievements, history, free chip refills, local profile, accent themes, JSON backup/restore
- **Local study groups:** private notes for friends and clubs (not online messaging)
- **Responsive layout** with mobile support, an app icon, web manifest, and service-worker offline caching after first load

## Open and publish

The entry point is `index.html`. Open it directly in a browser for a local preview, or publish the repository with GitHub Pages.

To publish:

1. Open **Settings → Pages** for this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose `main` and `/(root)`, then save.
4. Once GitHub finishes deploying, visit **https://apmunn.github.io/Pokerhub/**.

On a free GitHub plan, a private repository may need to be made **Public** before GitHub Pages can publish it. Do not commit secrets or private information to a public repository.

## Test the game engine

With Node.js 18 or newer:

```bash
npm test
```

The repository includes tests for hand rankings, the ace-low straight, choosing the best five cards from seven, betting rounds, folding, all-in, and equity simulation. GitHub Actions is configured to run these tests on pushes and pull requests. Automated tests do not replace manual browser testing.

## Important limitations

This is a **complete standalone solo-practice prototype**, not a production multiplayer service. GitHub Pages hosts static files; it does not provide a real-time poker backend. Therefore, the following are **not implemented**:

- Real-time games against other human players
- Online accounts, friends, chat, and shared clubs
- Verified worldwide matchmaking and rankings
- Online multiplayer tournaments
- A connected generative AI coach
- Cross-device cloud progress syncing

The computer opponent is intentionally simple, and betting logic is simplified compared with a fully audited tournament poker engine. The equity tool is a Monte Carlo approximation, not a guarantee.

Progress is stored in browser `localStorage`. Download a JSON backup from **Profile** before clearing browser data or switching devices. The app is educational and uses play chips only.

## Online multiplayer (two-player beta)

PokerHub now includes `multiplayer.html` and a Node.js WebSocket server in `server.cjs`. The server creates six-character private room codes, deals hidden cards separately to each player, validates turns and actions, advances the board, compares showdown hands, and distributes fictional chips. It supports reconnection in the same browser session while the server remains running.

### Start locally or in StackBlitz

Run `npm install` then `npm start`. Visit `http://localhost:3000/multiplayer.html` in two browser tabs or devices connected to the running server. The preview's WebSocket endpoint is `/ws`.

### Deploy online

The repository contains `render.yaml` for a Node.js web service. In Render, connect the GitHub repository and deploy the blueprint or create a Node web service with build command `npm install` and start command `npm start`. After deployment, use `https://YOUR-SERVICE-HOST/multiplayer.html` and share the invite link with a friend. Hosting provider pricing, availability, and sleep behavior may vary. A GitHub Pages-only site cannot run the multiplayer server; use the deployed Node.js URL instead.

**Beta limitations:** Rooms are two-player only. There is no authentication, public matchmaking, persistent online balances, chat, or robust disconnect/time-out handling. A disconnected player can pause the game; a server restart resets rooms. Bets are simplified to check, call, fold, or fixed 20-chip raises; there is no all-in or side-pot support in multiplayer yet. This is an early multiplayer prototype and has not been independently browser-tested. Use only free virtual chips.

## PokerHub 3.0 Player Center

Open `portal.html` for the new responsive Player Center. It adds a dashboard, local profile customization (nickname, avatar, bio), saved friend and club names, local notifications, local learning rankings, preferences, data export/deletion, a help center, privacy and terms pages, and a custom 404 page. The original `index.html` links to Player Center and the multiplayer beta. Existing solo play and lessons remain available.

**Feature status:** These Player Center features use browser localStorage and work without an account backend. They are not secure sign-ups or live social accounts. Real authentication, email verification, password resets, real friend requests, online messaging, global rankings, cross-device sync, moderation, and push notifications require a backend and further security review. The privacy and terms pages are initial project drafts and need review before public production use.

### Preview

With Node.js installed, run `npm install && npm start`, then open `http://localhost:3000/portal.html`. Static GitHub Pages can display Player Center, but not run the multiplayer WebSocket server.
