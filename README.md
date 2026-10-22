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
