# Hope Harvest (RGV Pantry Finder)

A lightweight pantry-finder + recipe-suggester web app.

It serves a simple front-end (React loaded via CDN in the browser) from an Express server. Pantry and recipe data are stored locally using a file-backed NeDB database.

## Features

- Search pantries by ZIP and filter by offerings (produce, protein, diapers, etc.)
- Pantry detail page with hours, eligibility, notes, and quick links (maps / call / website)
- “What can I cook?” page that suggests recipes based on checked ingredients (optionally prefilled from a pantry’s weekly ingredient availability)
- Optional admin UI for adding/editing/deleting pantries and updating weekly ingredient availability

## Tech Stack

- Server: Node.js + Express (`server.js`)
- DB: `nedb-promises` (files stored under `data/`)
- Client: `index.html` + `app.js` (React 18 via CDN + Babel in the browser)

## Quick Start

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Admin Mode

Admin endpoints and the Admin page are protected by an environment variable token.

1) Set the token when starting the server:

Windows (PowerShell):

```powershell
$env:ADMIN_TOKEN="your-secret-token"
npm start
```

Windows (cmd.exe):

```bat
set ADMIN_TOKEN=your-secret-token
npm start
```

2) Open the app and go to `#/admin`, then paste the token into the “Admin token” field.

Requests authenticate with the `X-Admin-Token` header.

## Data Storage & Seeding

- Databases are created under `data/`:
  - `data/pantries.db`
  - `data/recipes.db`
- If a DB is empty on startup, it is seeded from:
  - `seed/pantries.json`
  - `seed/recipes.json`

## API

Public:

- `GET /api/pantries` (sorted by `name`)
- `GET /api/pantries/:id`
- `GET /api/recipes` (sorted by `title`)
- `GET /api/recipes/:id`

Admin-only (requires `X-Admin-Token`):

- `POST /api/pantries` (JSON body must include `id`)
- `PUT /api/pantries/:id` (body `id` must match URL `:id`)
- `DELETE /api/pantries/:id`
- `POST /api/recipes` (JSON body must include `id`)
- `PUT /api/recipes/:id` (body `id` must match URL `:id`)
- `DELETE /api/recipes/:id`

Admin helpers:

- `GET /api/admin/status` → `{ adminConfigured: boolean }`
- `GET /api/admin/token-check` → `{ ok: true }` (admin-only)

## Project Layout

- `server.js` — Express server + API
- `src/db.js` — NeDB setup + seeding logic
- `index.html` — loads React + Babel and mounts the app
- `app.js` — client UI (search, pantry detail, cook ideas, admin)
- `styles.css` — styling
- `seed/` — initial pantry/recipe JSON data
- `assets/` — logos

## Notes

- This repo intentionally has no front-end build pipeline; it’s designed to run with `npm start` and a single server process.
- Distance sorting is approximate and uses a small built-in list of ZIP centroids.
