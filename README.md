# Hope Harvest - Pantry Finder

This is a webpage that helps people find their local pantries and gives them recipes

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

Admin auth uses the `X-Admin-Token` header.
