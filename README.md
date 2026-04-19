# RGV Pantry Finder

This is a small React-in-the-browser front-end (`index.html` + `app.js`) served by a Node.js API that stores pantry data in a local database file.

## Run

```bash
npm install
npm start
```

To enable the admin page, set an admin token before starting:

```bat
set ADMIN_TOKEN=your-secret-token
npm start
```

Then open:

- `http://localhost:3000`

## Data

- Pantry records are stored in `data/pantries.db`.
- Initial seed data lives in `seed/pantries.json` (only used when the DB is empty).
- Pantries can optionally store weekly ingredient availability in `availableIngredients`.

## API

- `GET /api/pantries`
- `GET /api/pantries/:id`
- `GET /api/recipes`
- `GET /api/recipes/:id`
- `POST /api/pantries` (admin-only; JSON body with at least an `id`)
- `PUT /api/pantries/:id` (admin-only)
- `DELETE /api/pantries/:id` (admin-only)
- `POST /api/recipes` (admin-only)
- `PUT /api/recipes/:id` (admin-only)
- `DELETE /api/recipes/:id` (admin-only)

Admin auth uses the `X-Admin-Token` header.
