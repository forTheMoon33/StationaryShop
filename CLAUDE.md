# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StationaryShop is a browser-based stationery-themed game. Players design stationery and sell it. Currently a polished skeleton; no backend.

## Commands

```bash
# Dev server (http://localhost:5173)
npm run dev

# Production build (output to dist/)
npm run build

# Preview production build
npm run preview
```

> npm has a permissions issue with the default cache on this machine. If `npm install` fails with EPERM, use:
> `npm install --cache /tmp/npm-cache`

## Architecture

**Stack:** React 18 + Vite 5, React Router v6, CSS Modules. Frontend only.

**Routing** (`src/App.jsx`):
- `/` → `MainMenu` — full-screen two-panel layout (sidebar + background)
- `/game` → `Game` — tab-based game shell

**Page structure:**

```
src/
  pages/
    MainMenu/
      MainMenu.jsx          # sidebar with nav buttons; "New Game" navigates to /game
      MainMenu.module.css
    Game/
      Game.jsx              # top navbar, renders active tab component
      Game.module.css
      tabs/
        Shop.jsx
        Workshop.jsx
        OnlineChat.jsx
        Tab.module.css      # shared placeholder style used by all three tabs
```

**Design tokens** (used consistently across CSS Modules):
- Background cream: `#F0E4CC`
- Sidebar/navbar: `rgba(45, 25, 10, 0.88)` dark brown, `backdrop-filter: blur`
- Accent gold: `#c9a87c`
- Text light: `#f5e6c8`, muted: `#e8d5b0`
- Fonts: Lora (serif, loaded from Google Fonts), Noto Serif SC (Chinese)

**Adding a new tab:** create `src/pages/Game/tabs/NewTab.jsx` using `Tab.module.css`, then add an entry to the `TABS` array in `Game.jsx`.
